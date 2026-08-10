/**
 * Email Service (Mock Implementation)
 * 
 * In a production environment, this would use nodemailer with SendGrid/AWS SES 
 * or an SMS provider like MSG91.
 */

export const sendShortlistEmail = async (candidateEmail: string, candidateName: string, employerName: string) => {
  console.log(`\n======================================================`);
  console.log(`📧 MOCK EMAIL DISPATCHED`);
  console.log(`======================================================`);
  console.log(`To: ${candidateEmail}`);
  console.log(`Subject: You've been shortlisted by ${employerName}! 🎉`);
  console.log(`\nHi ${candidateName},`);
  console.log(`Great news! Your TalentForge profile and verified badges have caught the eye of ${employerName}.`);
  console.log(`They have added you to their recruiter shortlist and will be in touch soon regarding next steps.`);
  console.log(`\nLog in to your TalentForge dashboard to view your application status.`);
  console.log(`\nBest,`);
  console.log(`The TalentForge Team`);
  console.log(`======================================================\n`);
  
  // Simulate network delay
  return new Promise((resolve) => setTimeout(resolve, 500));
};
