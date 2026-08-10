import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Scanning database for AI-generated problems...');
  
  // Find all problems where slug starts with "ai-"
  const aiProblems = await prisma.problem.findMany({
    where: {
      slug: {
        startsWith: 'ai-',
      },
    },
    select: {
      title: true,
      slug: true,
      tier: true,
      domain: true,
      reward: true,
      description: true,
      publicTestCases: true,
      hiddenTestCases: true,
    }
  });

  if (aiProblems.length === 0) {
    console.log('ℹ️ No AI-generated problems found in the database.');
    return;
  }

  console.log(`✅ Found ${aiProblems.length} AI-generated problems.`);
  
  const outputPath = path.join(__dirname, 'ai-seeds.json');
  fs.writeFileSync(outputPath, JSON.stringify(aiProblems, null, 2), 'utf-8');
  
  console.log(`💾 Successfully exported to: ${outputPath}`);
  console.log(`🚀 Next time you run 'npm run seed', these problems will be automatically restored!`);
}

main()
  .catch((e) => {
    console.error('❌ Export failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
