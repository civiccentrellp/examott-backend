
import type { Question, Option, Attachment } from '@prisma/client';
export const generateQuestionSnapshot = ({
  id,
  question,
  explanation,
  type,
  correctType,
  paragraph,
  options,
  attachments,
  children = [],
}: {
  id: string;
  question: any;
  explanation: any;
  type: string;
  correctType: string;
  paragraph?: any;
  options: Option[];
  attachments: Attachment[];
  children?: {
    id: string;
    question: any;
    explanation?: any;
    type: string;
    correctType: string;
    options: Option[];
    attachments: Attachment[];
  }[];
}) => {
  const correctAnswer =
    correctType === 'SINGLE'
      ? options.find((opt) => opt.correct)?.value ?? null
      : options.filter((opt) => opt.correct).map((opt) => opt.value);

  return {
    id, // ✅ Include parent id
    question,
    explanation,
    type,
    correctType,
    paragraph,
    correctAnswer,
    options: options.map((opt) => ({
      value: opt.value,
      correct: opt.correct,
    })),
    attachments: attachments.map((att) => ({
      url: att.url,
      type: att.type,
    })),
    children: children.map((child) => {
      const childCorrectAnswer =
        child.correctType === 'SINGLE'
          ? child.options.find((opt) => opt.correct)?.value ?? null
          : child.options.filter((opt) => opt.correct).map((opt) => opt.value);

      return {
        id: child.id,
        question: child.question,
        explanation: child.explanation,
        type: child.type,
        correctType: child.correctType,
        correctAnswer: childCorrectAnswer,
        options: child.options.map((opt) => ({
          value: opt.value,
          correct: opt.correct,
        })),
        attachments: child.attachments.map((att) => ({
          url: att.url,
          type: att.type,
        })),
      };
    }),
  };
};
