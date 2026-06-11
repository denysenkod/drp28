import type { QuizAnswers, Style } from "@/lib/types";

export type QuizOption = {
  value: string;
  label: string;
  image?: string;
  gender?: string;
  hairType?: string;
  length?: string;
  upkeep?: string;
  keywords?: string[];
  exclusive?: boolean;
};

export type QuizQuestion = {
  id: string;
  title: string;
  sub?: string;
  layout: "image" | "text";
  multi?: boolean;
  options: QuizOption[];
};

export const quizQuestions: QuizQuestion[] = [
  {
    id: "style",
    title: "What kind of styles are you looking for?",
    layout: "image",
    options: [
      { value: "masculine", label: "Masculine styles", gender: "Men", image: "/Images/MasculineStyles.webp" },
      { value: "feminine", label: "Feminine styles", gender: "Women", image: "/Images/FeminineStyles.jpg" },
      { value: "unisex", label: "Open to anything", gender: "Unisex", image: "/Images/androgynous.avif" }
    ]
  },
  {
    id: "texture",
    title: "What is closest to your hair texture?",
    layout: "image",
    options: [
      { value: "straight", label: "Straight", hairType: "Straight Hair", image: "/Images/StraightHair.jpg" },
      { value: "wavy", label: "Wavy", hairType: "Wavy Hair", image: "/Images/WavyHair.jpg" },
      { value: "curly", label: "Curly", hairType: "Curly Hair", image: "/Images/Curly.jpg" },
      { value: "coily", label: "Coily", hairType: "Coily Hair", image: "/Images/CoilyHair.jpg" }
    ]
  },
  {
    id: "length",
    title: "How long are you thinking?",
    layout: "image",
    options: [
      { value: "very-short", label: "Very short", length: "Very Short", image: "/Images/veryShortHair.png" },
      { value: "short", label: "Short", length: "Short", image: "/Images/ShortHair.jpg" },
      { value: "medium", label: "Medium", length: "Medium", image: "/Images/medium.jpg" },
      { value: "long", label: "Long", length: "Long", image: "/Images/LongHair.webp" },
      { value: "very-long", label: "Very long", length: "Very Long", image: "/Images/VeryLongHair.avif" }
    ]
  },
  {
    id: "face",
    title: "Which face shape should these styles suit?",
    layout: "text",
    options: [
      { value: "oval", label: "Oval" },
      { value: "round", label: "Round" },
      { value: "square", label: "Square" },
      { value: "heart", label: "Heart" },
      { value: "diamond", label: "Diamond" },
      { value: "none", label: "No preference", exclusive: true }
    ]
  },
  {
    id: "maintenance",
    title: "How much maintenance feels realistic?",
    layout: "text",
    options: [
      { value: "low", label: "Low", upkeep: "Low" },
      { value: "medium", label: "Medium", upkeep: "Medium" },
      { value: "high", label: "High", upkeep: "High" },
      { value: "none", label: "No preference", exclusive: true }
    ]
  }
];

export function toggleAnswer(answers: QuizAnswers, question: QuizQuestion, value: string): QuizAnswers {
  const option = question.options.find((item) => item.value === value);
  const current = answers[question.id] || [];
  if (!question.multi) return { ...answers, [question.id]: [value] };
  if (option?.exclusive) return { ...answers, [question.id]: [value] };
  const next = current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current.filter((item) => !question.options.find((opt) => opt.value === item)?.exclusive), value];
  return { ...answers, [question.id]: next };
}

export function filterStyles(styles: Style[], answers: QuizAnswers, search = "") {
  const selectedOptions = quizQuestions.flatMap((question) =>
    (answers[question.id] || [])
      .map((value) => question.options.find((option) => option.value === value))
      .filter(Boolean) as QuizOption[]
  );
  const needle = search.trim().toLowerCase();

  return styles.filter((style) => {
    if (needle) {
      const haystack = [style.name, style.description, style.gender, style.length, style.hairType, ...style.labels]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    for (const option of selectedOptions) {
      if (option.value === "none") continue;
      if (option.gender && option.gender !== "Unisex" && style.gender !== option.gender && style.gender !== "Unisex") return false;
      if (option.hairType && style.hairType && style.hairType !== option.hairType) return false;
      if (option.length && style.length && style.length !== option.length) return false;
      if (option.upkeep && style.upkeep && style.upkeep !== option.upkeep) return false;
      if (option.keywords?.length) {
        const haystack = [style.name, style.description, ...style.labels].join(" ").toLowerCase();
        if (!option.keywords.some((keyword) => haystack.includes(keyword))) return false;
      }
    }

    return true;
  });
}
