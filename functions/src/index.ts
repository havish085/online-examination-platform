import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { generateMCQs } from "./gemini";

admin.initializeApp();

/**
 * Cloud Function to generate MCQs using Gemini.
 */
export const generateAIQuestions = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
  }

  const { subject, topic, difficulty, count } = request.data;
  
  if (!subject || !topic || !difficulty) {
    throw new HttpsError("invalid-argument", "Missing required parameters: subject, topic, or difficulty.");
  }

  if (difficulty !== "easy" && difficulty !== "medium" && difficulty !== "hard") {
    throw new HttpsError("invalid-argument", "Difficulty must be 'easy', 'medium', or 'hard'.");
  }

  const uid = request.auth.uid;
  try {
    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    const userData = userDoc.data();
    
    if (!userData || (userData.role !== "faculty" && userData.role !== "admin")) {
      throw new HttpsError("permission-denied", "Unauthorized. Only faculty or admin can generate AI questions.");
    }

    const questions = await generateMCQs(subject, topic, difficulty, count || 10);
    return { success: true, questions };
  } catch (error: any) {
    console.error("Error in generateAIQuestions function:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", error.message || "An error occurred while generating questions.");
  }
});

/**
 * Cloud Function to securely submit an exam attempt.
 * Evaluates student answers against correct answers, calculates score/percentage,
 * dynamically computes class rank, and saves the result document.
 */
export const submitExamAttempt = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be authenticated to submit an exam.");
  }

  const { attemptId } = request.data;
  if (!attemptId) {
    throw new HttpsError("invalid-argument", "Missing required parameter: attemptId.");
  }

  const db = admin.firestore();
  
  try {
    // 1. Fetch attempt document
    const attemptRef = db.collection("attempts").doc(attemptId);
    const attemptDoc = await attemptRef.get();
    if (!attemptDoc.exists) {
      throw new HttpsError("not-found", "Exam attempt not found.");
    }

    const attemptData = attemptDoc.data()!;
    if (attemptData.userId !== request.auth.uid) {
      throw new HttpsError("permission-denied", "You can only submit your own attempt.");
    }
    if (attemptData.isSubmitted) {
      throw new HttpsError("failed-precondition", "This exam attempt has already been submitted.");
    }

    // 2. Fetch exam document to get time windows and marks
    const examId = attemptData.examId;
    const examRef = db.collection("exams").doc(examId);
    const examDoc = await examRef.get();
    if (!examDoc.exists) {
      throw new HttpsError("not-found", "Associated exam not found.");
    }
    const examData = examDoc.data()!;

    // 3. Fetch correct answers and question marks
    const answersSnap = await examRef.collection("answers").get();
    const correctAnswers: Record<string, string> = {};
    answersSnap.docs.forEach(doc => {
      correctAnswers[doc.id] = doc.data().correctAnswer;
    });

    const questionsSnap = await examRef.collection("questions").get();
    const studentAnswers = attemptData.answers || {};
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let totalMarks = examData.totalMarks || 0;

    questionsSnap.docs.forEach(qDoc => {
      const qId = qDoc.id;
      const qData = qDoc.data();
      const marks = qData.marks || 1;
      const studentAns = studentAnswers[qId];
      const correctAns = correctAnswers[qId];

      if (studentAns === correctAns) {
        score += marks;
        correctCount++;
      } else {
        if (studentAns) {
          wrongCount++;
        }
      }
    });

    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
    const now = admin.firestore.Timestamp.now();
    const timeTaken = Math.max(0, now.seconds - attemptData.startTime.seconds);

    // 4. Update the attempt document
    await attemptRef.update({
      isSubmitted: true,
      submittedAt: now,
      timeTaken
    });

    // 5. Calculate rank dynamically
    const resultsColl = db.collection("results");
    const otherResultsSnap = await resultsColl.where("examId", "==", examId).get();
    let rank = 1;
    otherResultsSnap.docs.forEach(doc => {
      if (doc.data().score > score) {
        rank++;
      }
    });

    // 6. Write result document
    const resultDoc = {
      id: attemptId,
      examId,
      userId: request.auth.uid,
      score,
      percentage,
      correctCount,
      wrongCount,
      rank,
      submittedAt: now,
      timeTaken
    };
    await resultsColl.doc(attemptId).set(resultDoc);

    // 7. Push user notification
    await db.collection("notifications").add({
      userId: request.auth.uid,
      message: `Your exam "${examData.title}" has been evaluated. Score: ${score}/${totalMarks} (${percentage}%)`,
      isRead: false,
      createdAt: now
    });

    // 8. Trigger calculation of Exam Analytics dynamically or schedule updates.
    // We can also compute exam averages in this call
    const examAttemptsQuery = await resultsColl.where("examId", "==", examId).get();
    const allScores = examAttemptsQuery.docs.map(d => d.data().score);
    const allPercentages = examAttemptsQuery.docs.map(d => d.data().percentage);
    
    if (allScores.length > 0) {
      const averageScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;
      const highestScore = Math.max(...allScores);
      const lowestScore = Math.min(...allScores);
      const passCount = allPercentages.filter(p => p >= (examData.passPercentage || 50)).length;
      const passPercentage = Math.round((passCount / allScores.length) * 100);

      // Score distribution histogram categories: 0-20, 21-40, 41-60, 61-80, 81-100
      const distribution = { '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0 };
      allPercentages.forEach(p => {
        if (p <= 20) distribution['0-20']++;
        else if (p <= 40) distribution['21-40']++;
        else if (p <= 60) distribution['41-60']++;
        else if (p <= 80) distribution['61-80']++;
        else distribution['81-100']++;
      });

      // Update analytics collection
      await db.collection("analytics").doc(examId).set({
        examId,
        averageScore: Math.round(averageScore * 10) / 10,
        highestScore,
        lowestScore,
        passPercentage,
        distribution,
        totalAttempts: allScores.length,
        updatedAt: now
      }, { merge: true });
    }

    return { success: true, result: resultDoc };
  } catch (error: any) {
    console.error("Error submitting exam:", error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError("internal", error.message || "An error occurred during submission.");
  }
});
