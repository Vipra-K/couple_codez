import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

const prisma = new PrismaClient({ adapter });

async function main() {
  const templates = [
    {
      name: 'Classic Rose',
      backgroundType: 'COLOR',
      backgroundColor: '#FDF2F4',
      senderBubbleColor: '#E11D48',
      receiverBubbleColor: '#FFFFFF',
      senderTextColor: '#FFFFFF',
      receiverTextColor: '#1A1A2E',
      accentColor: '#E11D48',
    },
    {
      name: 'Sunset Glow',
      backgroundType: 'GRADIENT',
      gradientStartColor: '#FF512F',
      gradientEndColor: '#F09819',
      gradientAngle: 45,
      senderBubbleColor: '#A16207',
      receiverBubbleColor: '#FFFFFFEE',
      senderTextColor: '#FFFFFF',
      receiverTextColor: '#1A1A2E',
      accentColor: '#FF512F',
    },
    {
      name: 'Starlit Night',
      backgroundType: 'IMAGE',
      backgroundImageUrl: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop',
      senderBubbleColor: '#0369A1',
      receiverBubbleColor: '#1E293BEE',
      senderTextColor: '#FFFFFF',
      receiverTextColor: '#F1F5F9',
      accentColor: '#38BDF8',
    },
    {
      name: 'Lavender Mist',
      backgroundType: 'COLOR',
      backgroundColor: '#F5F3FF',
      senderBubbleColor: '#7E22CE',
      receiverBubbleColor: '#FFFFFF',
      senderTextColor: '#FFFFFF',
      receiverTextColor: '#1E1B4B',
      accentColor: '#7E22CE',
    },
    {
      name: 'Forest Dream',
      backgroundType: 'GRADIENT',
      gradientStartColor: '#1D976C',
      gradientEndColor: '#93F9B9',
      gradientAngle: 135,
      senderBubbleColor: '#064E3B',
      receiverBubbleColor: '#FFFFFFEE',
      senderTextColor: '#FFFFFF',
      receiverTextColor: '#064E3B',
      accentColor: '#1D976C',
    }
  ];

  console.log('Seeding theme templates...');

  for (const template of templates) {
    await prisma.themeTemplate.upsert({
      where: { name: template.name },
      update: template as any,
      create: template as any,
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
