import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Field,
  LoadingState,
  PageHeader,
  Panel,
} from "@/components/pm/ui";
import {
  hasErrors,
  validateSettings,
  type Errors,
  type Settings,
} from "@/lib/pm";
import { useStore } from "@/lib/store";

export function SettingsPage() {
  const { state, ready, dispatch, resetData } = useStore();

  const [form, setForm] = useState<Settings>(state.settings);
  const [errors, setErrors] = useState<Errors<Settings>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm(state.settings);
  }, [state.settings]);

  if (!ready) {
    return <LoadingState label="Loading settings" />;
  }

  const updateField = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
    setSaved(false);
  };

  const hasChanges =
    JSON.stringify(form) !== JSON.stringify(state.settings);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validateSettings(form);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    dispatch({
      type: "settings/update",
      settings: {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
      },
    });

    setSaved(true);
    toast.success("Settings saved");
  };

  const handleDiscard = () => {
    setForm(state.settings);
    setErrors({});
    setSaved(false);
  };

  const handleReset = () => {
    resetData();
    toast.success("Sample data restored");
  };

  const preferences: {
    key: "emailNotifications" | "weeklyDigest" | "compactTables";
    label: string;
    hint: string;
  }[] = [
    {
      key: "emailNotifications",
      label: "Email notifications",
      hint: "Get an email when you're assigned a task.",
    },
    {
      key: "weeklyDigest",
      label: "Weekly digest",
      hint: "A Monday summary of progress across projects.",
    },
    {
      key: "compactTables",
      label: "Compact tables",
      hint: "Show denser rows in task lists.",
    },
  ];

  return (
    <>
      <PageHeader
        title="Settings"
        description="Your profile and preferences."
      />

      <form onSubmit={handleSubmit} noValidate className="grid gap-6 max-w-3xl">
        <Panel title="Profile">
          <div className="grid grid-cols-1 gap-4">
            <Field
              id="s-name"
              label="Full name *"
              error={errors.name}
            >
              <Input
                id="s-name"
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={
                  errors.name ? "s-name-error" : undefined
                }
                autoComplete="name"
              />
            </Field>

            <Field
              id="s-email"
              label="Email *"
              error={errors.email}
            >
              <Input
                id="s-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={
                  errors.email ? "s-email-error" : undefined
                }
                autoComplete="email"
              />
            </Field>

            <Field id="s-title" label="Job title">
              <Input
                id="s-title"
                value={form.jobTitle}
                onChange={(event) =>
                  updateField("jobTitle", event.target.value)
                }
              />
            </Field>
          </div>
        </Panel>

        <Panel title="Preferences">
          <ul className="divide-y">
            {preferences.map((preference) => (
              <li
                key={preference.key}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div>
                  <label
                    htmlFor={`s-${preference.key}`}
                    className="text-sm font-medium"
                  >
                    {preference.label}
                  </label>

                  <p className="text-xs text-muted-foreground">
                    {preference.hint}
                  </p>
                </div>

                <Switch
                  id={`s-${preference.key}`}
                  checked={form[preference.key]}
                  onCheckedChange={(value) =>
                    updateField(preference.key, value)
                  }
                />
              </li>
            ))}
          </ul>
        </Panel>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={!hasChanges}>
            Save changes
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={!hasChanges}
            onClick={handleDiscard}
          >
            Discard
          </Button>

          <p
            role="status"
            aria-live="polite"
            className="text-sm text-status-done"
          >
            {saved && !hasChanges ? "All changes saved." : ""}
          </p>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                className="ml-auto text-white"
              >
                Reset sample data
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Restore sample data?
                </AlertDialogTitle>

                <AlertDialogDescription>
                  This will restore the original sample data and replace your
                  current demo data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>

                <AlertDialogAction
                  onClick={handleReset}
                  className="bg-destructive text-white hover:bg-destructive/90"
                >
                  Restore sample data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </form>
    </>
  );
}