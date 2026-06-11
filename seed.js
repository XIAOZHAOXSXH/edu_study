async function main() {
  const { PrismaClient } = await import('@prisma/client')
  const prisma = new PrismaClient()

  const questions = [
    {
      type: 'SINGLE_CHOICE',
      content: '教育学是研究什么的科学？',
      options: JSON.stringify([
        { label: 'A', text: '教育现象和教育问题' },
        { label: 'B', text: '教育规律' },
        { label: 'C', text: '教育方法' },
        { label: 'D', text: '教育历史' },
      ]),
      answer: 'A',
      explanation: '教育学以教育现象和教育问题为研究对象，揭示教育规律。',
      category: '教育学基础',
      difficulty: 1,
    },
    {
      type: 'SINGLE_CHOICE',
      content: '世界上最早的一部教育专著是？',
      options: JSON.stringify([
        { label: 'A', text: '《论语》' },
        { label: 'B', text: '《学记》' },
        { label: 'C', text: '《大教学论》' },
        { label: 'D', text: '《理想国》' },
      ]),
      answer: 'B',
      explanation: '《学记》是中国古代也是世界上最早的教育教学专著。',
      category: '教育学基础',
      difficulty: 1,
    },
    {
      type: 'TRUE_FALSE',
      content: '教育的本质是一种有目的地培养人的社会活动。',
      options: null,
      answer: 'true',
      explanation: '这是教育区别于其他社会活动的根本特征。',
      category: '教育学基础',
      difficulty: 1,
    },
    {
      type: 'FILL_BLANK',
      content: '教育的基本要素包括教育者、受教育者和______。',
      options: null,
      answer: '教育影响',
      explanation: '教育的三个基本要素是教育者、受教育者和教育影响。',
      category: '教育学基础',
      difficulty: 2,
    },
    {
      type: 'SHORT_ANSWER',
      content: '简述现代教育制度的发展趋势。',
      options: null,
      answer:
        '加强学前教育并重视与小学教育衔接；强化普及义务教育并延长义务教育年限；普通教育与职业教育相互渗透；高等教育类型多样化；学历教育与非学历教育界限淡化；教育制度有利于国际交流。',
      explanation: '答题时可从学前、义务、职业、高等、终身学习和国际化六个角度展开。',
      category: '教育制度',
      difficulty: 3,
    },
    {
      type: 'MULTIPLE_CHOICE',
      content: '下列属于教师劳动特点的有？',
      options: JSON.stringify([
        { label: 'A', text: '复杂性' },
        { label: 'B', text: '创造性' },
        { label: 'C', text: '示范性' },
        { label: 'D', text: '长期性' },
      ]),
      answer: 'A,B,C,D',
      explanation: '教师劳动具有复杂性、创造性、示范性、长期性等特点。',
      category: '教师与学生',
      difficulty: 2,
    },
  ]

  for (const question of questions) {
    await prisma.question.create({ data: question })
  }

  console.log(`Created ${questions.length} sample questions`)
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
