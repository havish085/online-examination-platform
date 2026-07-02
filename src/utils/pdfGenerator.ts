import { jsPDF } from 'jspdf';

export const downloadResultPDF = (result: any, exam: any, userName: string) => {
  const doc = new jsPDF();
  
  // Header Box
  doc.setFillColor(2, 132, 199); // Slate-500
  doc.rect(0, 0, 210, 45, 'F');

  // Title
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("EXAMINATION REPORT CARD", 105, 20, { align: "center" });

  // Subtitle
  doc.setFontSize(10);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(224, 242, 254);
  doc.text("Online Examination & Assessment Portal", 105, 28, { align: "center" });

  // Candidate Details Section
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.setFont("Helvetica", "bold");
  doc.text("CANDIDATE INFORMATION", 20, 60);
  
  doc.setDrawColor(226, 232, 240);
  doc.line(20, 64, 190, 64);

  // Left Column Details
  doc.setFont("Helvetica", "bold");
  doc.text("Candidate Name:", 20, 75);
  doc.setFont("Helvetica", "normal");
  doc.text(userName, 65, 75);

  doc.setFont("Helvetica", "bold");
  doc.text("Exam Name:", 20, 85);
  doc.setFont("Helvetica", "normal");
  doc.text(exam?.title || 'Examination', 65, 85);

  doc.setFont("Helvetica", "bold");
  doc.text("Subject/Topic:", 20, 95);
  doc.setFont("Helvetica", "normal");
  doc.text(`${exam?.subject || ''} - ${exam?.topic || ''}`, 65, 95);

  doc.setFont("Helvetica", "bold");
  doc.text("Attempt Date:", 20, 105);
  doc.setFont("Helvetica", "normal");
  const completedDate = result.submittedAt?.toDate()
    ? result.submittedAt.toDate().toLocaleString()
    : new Date().toLocaleString();
  doc.text(completedDate, 65, 105);

  // Score Table Section
  doc.setFont("Helvetica", "bold");
  doc.text("PERFORMANCE RESULTS", 20, 125);
  doc.line(20, 129, 190, 129);

  // Score stats
  doc.setFont("Helvetica", "bold");
  doc.text("Marks Obtained:", 20, 140);
  doc.setFont("Helvetica", "normal");
  doc.text(`${result.score} / ${exam?.totalMarks || 0}`, 65, 140);

  doc.setFont("Helvetica", "bold");
  doc.text("Percentage:", 20, 150);
  doc.setFont("Helvetica", "normal");
  doc.text(`${result.percentage}%`, 65, 150);

  doc.setFont("Helvetica", "bold");
  doc.text("Correct Answers:", 20, 160);
  doc.setFont("Helvetica", "normal");
  doc.text(`${result.correctCount}`, 65, 160);

  doc.setFont("Helvetica", "bold");
  doc.text("Time Taken:", 20, 170);
  doc.setFont("Helvetica", "normal");
  const mins = Math.floor(result.timeTaken / 60);
  const secs = result.timeTaken % 60;
  doc.text(`${mins}m ${secs}s`, 65, 170);

  doc.setFont("Helvetica", "bold");
  doc.text("Class Rank:", 20, 180);
  doc.setFont("Helvetica", "normal");
  doc.text(`# ${result.rank}`, 65, 180);

  // Status Badge
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(16);
  const isPassed = result.percentage >= (exam?.passPercentage || 50);
  if (isPassed) {
    doc.setTextColor(16, 185, 129); // Green
    doc.setFillColor(240, 253, 244);
    doc.rect(40, 195, 130, 15, 'F');
    doc.text("RESULT STATUS: PASSED", 105, 205, { align: "center" });
  } else {
    doc.setTextColor(239, 68, 68); // Red
    doc.setFillColor(254, 242, 242);
    doc.rect(40, 195, 130, 15, 'F');
    doc.text("RESULT STATUS: FAILED", 105, 205, { align: "center" });
  }

  // Footer text
  doc.setFont("Helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("This is an electronically generated scorecard. No physical signatures are required.", 105, 280, { align: "center" });

  doc.save(`Result_${(exam?.title || 'Exam').replace(/\s+/g, '_')}.pdf`);
};
