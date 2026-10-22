import { Translator } from "@/features/translate/translator";
import { getTranslatorSettings } from "@/translate/settings";

export const dynamic = "force-dynamic";

export default async function TranslatePage() {
  const settings = await getTranslatorSettings();
  return <Translator native={settings.native} target={settings.target} hasKey={settings.keySource !== "none"} />;
}
