"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { quizQuestions, toggleAnswer } from "@/lib/quiz";
import type { QuizAnswers } from "@/lib/types";
import { readAnswers, writeAnswers } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function QuizFlow() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<QuizAnswers>({});
  const question = quizQuestions[step];
  const progress = Math.round(((step + 1) / quizQuestions.length) * 100);

  React.useEffect(() => {
    setAnswers(readAnswers());
  }, []);

  function setNextAnswers(next: QuizAnswers) {
    setAnswers(next);
    writeAnswers(next);
  }

  function next() {
    if (step < quizQuestions.length - 1) setStep((value) => value + 1);
    else router.push("/search/");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-2rem)] w-[min(1320px,calc(100%-24px))] flex-col pb-10 pt-4">
      <div className="mb-5 flex items-start gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={() => (step > 0 ? setStep(step - 1) : router.push("/"))}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex-1 pt-2">
          <div className="mb-2 flex justify-between text-xs font-extrabold uppercase tracking-[0.14em] text-muted">
            <span>Question {step + 1}</span>
            <b className="text-ink">{progress}%</b>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <section className="grid flex-1 gap-5 md:grid-cols-[minmax(240px,380px)_1fr]">
        <div className="md:sticky md:top-6 md:self-start">
          <p className="eyebrow">Questionnaire</p>
          <h1 className="text-[clamp(34px,5vw,56px)] font-extrabold leading-none">{question.title}</h1>
          {question.sub ? <p className="mt-4 leading-7 text-muted">{question.sub}</p> : null}
        </div>

        <div className={cn("grid content-start gap-3", question.layout === "text" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
          {question.options.map((option) => {
            const selected = (answers[question.id] || []).includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "group relative overflow-hidden rounded-hm border bg-surface text-left transition hover:-translate-y-0.5 hover:border-[#d5c6b2]",
                  selected ? "border-accent ring-2 ring-accent/20" : "border-line",
                  question.layout === "text" ? "flex min-h-16 items-center px-4" : ""
                )}
                onClick={() => setNextAnswers(toggleAnswer(answers, question, option.value))}
              >
                {option.image ? (
                  <div className="aspect-[4/5] overflow-hidden bg-[#ede2c8]">
                    <img src={option.image} alt={option.label} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                  </div>
                ) : null}
                <div className="p-4 pr-12">
                  <div className="font-bold">{option.label}</div>
                </div>
                <span className={cn("absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-hm border bg-white", selected ? "border-accent bg-accent text-white" : "border-line text-transparent")}>
                  <Check className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-6 flex justify-end">
        <Button type="button" onClick={next}>
          {step < quizQuestions.length - 1 ? "Next" : "See matches"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </main>
  );
}
