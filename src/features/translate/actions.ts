"use server";

import { revalidatePath } from "next/cache";

import { routes } from "@/routes";
import { saveSchema, saveTranslation } from "@/translate/save";
import { saveTranslatorSettings } from "@/translate/settings";

export type SavedSummary = { added: number; existing: number; cardsCreated: number };

export async function saveTranslationAction(input: unknown): Promise<SavedSummary | { error: string }> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { error: "Nothing valid to save." };
  const { added, existing, cardsCreated } = await saveTranslation(parsed.data);
  revalidatePath(routes.words);
  return { added, existing, cardsCreated };
}

export async function saveTranslatorSettingsAction(formData: FormData): Promise<void> {
  const field = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : undefined;
  };
  await saveTranslatorSettings({
    ...(field("native") ? { native: field("native") as string } : {}),
    ...(field("target") ? { target: field("target") as string } : {}),
    ...(field("model") ? { model: field("model") as string } : {}),
    ...(field("apiKey") ? { apiKey: field("apiKey") as string } : {}),
    clearKey: formData.get("clearKey") === "on",
  });
  revalidatePath(routes.profile);
  revalidatePath(routes.translate);
}
