import type { MbtiCelebrities, MbtiTypeGroup, MbtiTypeInfo } from './mbti-types'

export const TYPE_INFO: Record<string, MbtiTypeInfo> = {
  INTJ: { name: "Architect", blurb: "Imaginative and strategic thinkers, with a plan for everything.", vibe: "Insightful | Independent | Decisive", gradient: "from-fuchsia-500 to-emerald-500", strengths: ["Logical analysis", "Strategic vision", "Strong independence"], growth: ["Emotional expression", "Flexibility", "Team collaboration"] },
  INTP: { name: "Logician", blurb: "Innovative inventors with an unquenchable thirst for knowledge.", vibe: "Curious | Objective | Original", gradient: "from-violet-500 to-rose-500", strengths: ["Abstract thinking", "Innovation", "Objective analysis"], growth: ["Execution", "Emotional understanding", "Everyday details"] },
  ENTJ: { name: "Commander", blurb: "Bold, imaginative and strong-willed leaders, always finding or making a way.", vibe: "Leadership | Decisive | Visionary", gradient: "from-rose-500 to-amber-500", strengths: ["Organization", "Decisive decisions", "Goal-oriented"], growth: ["Patience", "Empathy", "Emotional control"] },
  ENTP: { name: "Debater", blurb: "Smart and curious thinkers who cannot resist an intellectual challenge.", vibe: "Agile | Innovative | Challenging", gradient: "from-amber-500 to-fuchsia-500", strengths: ["Brainstorming", "Adaptability", "Broad knowledge"], growth: ["Focus", "Detail management", "Respect for tradition"] },
  INFJ: { name: "Advocate", blurb: "Quiet and mysterious, yet inspiring and tireless idealists.", vibe: "Insight | Compassion | Conviction", gradient: "from-emerald-500 to-fuchsia-500", strengths: ["Empathy", "Deep insight", "Strong ethics"], growth: ["Self-protection", "Conflict handling", "Practicality"] },
  INFP: { name: "Mediator", blurb: "Poetic, kind and altruistic people, always eager to help others.", vibe: "Pure | Idealistic | Sensitive", gradient: "from-rose-500 to-emerald-500", strengths: ["Creativity", "Values-driven", "Compassion"], growth: ["Practicality", "Stress tolerance", "Objective judgment"] },
  ENFJ: { name: "Protagonist", blurb: "Charismatic and inspiring leaders who captivate audiences.", vibe: "Influence | Passion | Altruism", gradient: "from-fuchsia-500 to-amber-500", strengths: ["Communication", "Inspiring others", "Social skills"], growth: ["Over-sacrifice", "Over-sensitivity", "Solitude"] },
  ENFP: { name: "Campaigner", blurb: "Enthusiastic, creative, sociable free spirits who always find a reason to smile.", vibe: "Energetic | Optimistic | Imaginative", gradient: "from-amber-500 to-violet-500", strengths: ["Interpersonal skills", "Innovative thinking", "Adaptability"], growth: ["Persistence", "Attention to detail", "Stress management"] },
  ISTJ: { name: "Logistician", blurb: "Practical and fact-minded individuals whose reliability cannot be doubted.", vibe: "Reliable | Steady | Dutiful", gradient: "from-emerald-600 to-amber-500", strengths: ["Responsibility", "Organization and discipline", "Attention to detail"], growth: ["Innovation", "Embracing change", "Emotional communication"] },
  ISFJ: { name: "Defender", blurb: "Very dedicated and warm protectors, always ready to defend their loved ones.", vibe: "Gentle | Loyal | Meticulous", gradient: "from-emerald-500 to-rose-500", strengths: ["Loyalty", "Caring for others", "Observation"], growth: ["Self-expression", "Saying no", "Adapting to new things"] },
  ESTJ: { name: "Executive", blurb: "Excellent administrators, unsurpassed at managing things or people.", vibe: "Order | Efficiency | Practical", gradient: "from-amber-600 to-rose-500", strengths: ["Organization", "Leadership", "Honesty and reliability"], growth: ["Flexibility", "Empathy", "Listening to others"] },
  ESFJ: { name: "Consul", blurb: "Compassionate, sociable, and helpful people, always eager to assist.", vibe: "Friendly | Responsible | Cooperative", gradient: "from-rose-500 to-amber-500", strengths: ["Interpersonal relationships", "Service mindset", "Execution"], growth: ["Independent thinking", "Handling conflict", "Overworking"] },
  ISTP: { name: "Virtuoso", blurb: "Bold and practical experimenters, masters of all kinds of tools.", vibe: "Resourceful | Practical | Independent", gradient: "from-emerald-500 to-violet-600", strengths: ["Hands-on ability", "Calm observation", "Problem solving"], growth: ["Long-term planning", "Emotional communication", "Consistency"] },
  ISFP: { name: "Adventurer", blurb: "Flexible and charming artists, always ready to explore and experience something new.", vibe: "Artistic | Sensitive | Free-spirited", gradient: "from-rose-500 to-emerald-500", strengths: ["Aesthetics", "Tolerance", "Love of life"], growth: ["Planning", "Stress tolerance", "Logical thinking"] },
  ESTP: { name: "Entrepreneur", blurb: "Smart, energetic, and perceptive people who truly enjoy living on the edge.", vibe: "Bold | Agile | Realistic", gradient: "from-amber-500 to-fuchsia-500", strengths: ["Action-oriented", "Adaptability", "Social charisma"], growth: ["Thoughtfulness", "Following rules", "Long-term commitment"] },
  ESFP: { name: "Entertainer", blurb: "Spontaneous, energetic and enthusiastic entertainers—life is never boring around them.", vibe: "Optimistic | Charming | Lively", gradient: "from-rose-500 to-amber-500", strengths: ["Expressiveness", "Social magnetism", "Living in the moment"], growth: ["Focus", "Future planning", "Objective judgment"] },
}

export const UNKNOWN_TYPE: MbtiTypeInfo = {
  name: "Unknown Type",
  blurb: "This is an undefined MBTI type combination.",
  vibe: "Mysterious | Unique | Unknown",
  gradient: "from-fuchsia-500 to-rose-500",
  strengths: ["Data needed", "Data needed", "Data needed"],
  growth: ["Data needed", "Data needed", "Data needed"],
}

export const TYPE_GROUPS: MbtiTypeGroup[] = [
  {
    title: "Rationals",
    code: "NT",
    description: "Strategic, curious, value objectivity and logic. They are natural thinkers and leaders.",
    types: ["INTJ", "INTP", "ENTJ", "ENTP"],
  },
  {
    title: "Idealists",
    code: "NF",
    description: "Compassionate, seek meaning, value personal growth. They are profound insights and inspiring individuals.",
    types: ["INFJ", "INFP", "ENFJ", "ENFP"],
  },
  {
    title: "Guardians",
    code: "SJ",
    description: "Practical, stable, value order and tradition. They are the foundation of society, reliable executors.",
    types: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
  },
  {
    title: "Explorers",
    code: "SP",
    description: "Flexible, spontaneous, value sensory experiences. They are action-oriented, good at handling emergencies and enjoying life.",
    types: ["ISTP", "ISFP", "ESTP", "ESFP"],
  },
]

export const CELEBRITIES: MbtiCelebrities = {
  INTJ: ["Elon Musk", "Friedrich Nietzsche", "Michelle Obama", "Christopher Nolan"],
  INTP: ["Albert Einstein", "Bill Gates", "Isaac Newton", "Rene Descartes"],
  ENTJ: ["Steve Jobs", "Gordon Ramsay", "Margaret Thatcher", "Franklin D. Roosevelt"],
  ENTP: ["Thomas Edison", "Leonardo da Vinci", "Salvador Dali", "Robert Downey Jr."],
  INFJ: ["Plato", "Nelson Mandela", "Martin Luther King Jr.", "Goethe"],
  INFP: ["J.K. Rowling", "William Shakespeare", "Vincent van Gogh", "John Lennon"],
  ENFJ: ["Barack Obama", "Oprah Winfrey", "Marlon Brando", "Maya Angelou"],
  ENFP: ["Robin Williams", "Walt Disney", "Quentin Tarantino", "Ellen DeGeneres"],
  ISTJ: ["Angela Merkel", "George Washington", "Jeff Bezos", "Natalie Portman"],
  ISFJ: ["Queen Victoria", "Queen Elizabeth II", "Beyonce", "Kate Middleton"],
  ESTJ: ["John D. Rockefeller", "James Monroe", "Judy Sheindlin", "Condoleezza Rice"],
  ESFJ: ["Taylor Swift", "Bill Clinton", "Jennifer Garner", "Steve Harvey"],
  ISTP: ["Audrey Hepburn", "Steve McQueen", "Tom Cruise", "Michael Jordan"],
  ISFP: ["Lana Del Rey", "Frida Kahlo", "Michael Jackson", "Britney Spears"],
  ESTP: ["Donald Trump", "Madonna", "Ernest Hemingway", "Bruce Lee"],
  ESFP: ["Marilyn Monroe", "Adele", "Justin Bieber", "Selena Gomez"],
}
