import { LANGUAGE_CODES, LANGUAGES } from "@/domain/languages";
import { saveTranslatorSettingsAction } from "@/features/translate/actions";
import type { TranslatorSettings } from "@/translate/settings";
import { Button, Input } from "@/ui";

const KEY_STATUS = {
  env: (tail: string) => `Set in the server environment (…${tail}).`,
  app: (tail: string) => `Saved in the app (…${tail}). Paste a new key to replace it.`,
  none: () => "No key yet. Translation needs one.",
} as const;

const options = LANGUAGE_CODES.map((code) => (
  <option key={code} value={code}>
    {LANGUAGES[code]}
  </option>
));

export function TranslatorSettingsForm({ settings }: { settings: TranslatorSettings }) {
  return (
    <form action={saveTranslatorSettingsAction} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          I speak
          <select name="native" defaultValue={settings.native} className="select w-full">
            {options}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          I am learning
          <select name="target" defaultValue={settings.target} className="select w-full">
            {options}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Model (OpenRouter id)
        <Input name="model" defaultValue={settings.model} autoComplete="off" spellCheck={false} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        OpenRouter key
        <Input name="apiKey" type="password" autoComplete="off" placeholder="sk-or-…" />
        <span className="text-base-content/70">{KEY_STATUS[settings.keySource](settings.keyTail)}</span>
      </label>
      {settings.keySource === "app" ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="clearKey" className="checkbox checkbox-sm" />
          Remove the saved key
        </label>
      ) : null}
      <Button type="submit">Save</Button>
    </form>
  );
}
