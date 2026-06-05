"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangleIcon,
  CalendarDaysIcon,
  ImagePlusIcon,
  ShieldCheckIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/page-header"
import type { AccountProfileData } from "@/features/account/queries"
import {
  PROFILE_AVATAR_MAX_SIZE,
  PROFILE_AVATAR_MIME_TYPES,
  PROFILE_BIO_MAX_LENGTH,
  formatProfileDate,
  formatUsageLimit,
  getProfileInitials,
  getUsagePercent,
} from "@/features/account/utils/profile"

import {
  deleteAccountAction,
  updateProfileAction,
} from "../actions"
import {
  profileFormSchema,
  type ProfileFormInput,
} from "../schemas"

type ProfilePageProps = {
  profile: AccountProfileData
}

type FieldErrors = Record<string, string[] | undefined>

export function ProfilePage({ profile }: ProfilePageProps) {
  const router = useRouter()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const avatarObjectUrlRef = React.useRef<string | null>(null)
  const [formValues, setFormValues] = React.useState<ProfileFormInput>({
    name: profile.user.name,
    phoneNumber: profile.user.phoneNumber ?? "",
    birthDate: profile.user.birthDate ?? "",
    gender: profile.user.gender ?? null,
    bio: profile.user.bio ?? "",
    avatarUrl: profile.user.avatarUrl ?? "",
  })
  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({})
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(
    profile.user.avatarUrl,
  )
  const [isSaving, setIsSaving] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleteEmail, setDeleteEmail] = React.useState("")
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    return () => {
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current)
      }
    }
  }, [])

  async function uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/account/avatar", {
      method: "POST",
      body: formData,
    })
    const payload = (await response.json()) as {
      url?: string
      message?: string
    }

    if (!response.ok || !payload.url) {
      throw new Error(payload.message ?? "Avatar gagal diunggah.")
    }

    return payload.url
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setFieldErrors({})

    try {
      const parsed = profileFormSchema.safeParse(formValues)

      if (!parsed.success) {
        setFieldErrors(parsed.error.flatten().fieldErrors)
        toast.error("Periksa kembali data yang kamu isi.")
        return
      }

      const avatarUrl = avatarFile
        ? await uploadAvatar(avatarFile)
        : formValues.avatarUrl
      const result = await updateProfileAction({
        ...formValues,
        name: parsed.data.name,
        phoneNumber: parsed.data.phoneNumber ?? "",
        birthDate: parsed.data.birthDate ?? "",
        gender: parsed.data.gender,
        bio: parsed.data.bio ?? "",
        avatarUrl: avatarUrl ?? "",
      })

      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {})
        toast.error(result.message)
        return
      }

      setAvatarFile(null)
      if (avatarObjectUrlRef.current) {
        URL.revokeObjectURL(avatarObjectUrlRef.current)
        avatarObjectUrlRef.current = null
      }
      setAvatarPreview(avatarUrl ?? null)
      setFormValues((current) => ({
        ...current,
        name: parsed.data.name,
        phoneNumber: parsed.data.phoneNumber ?? "",
        birthDate: parsed.data.birthDate ?? "",
        gender: parsed.data.gender,
        bio: parsed.data.bio ?? "",
        avatarUrl: avatarUrl ?? "",
      }))
      toast.success(result.message)
      router.refresh()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Profil gagal diperbarui.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true)
    setFieldErrors({})

    try {
      const result = await deleteAccountAction({ email: deleteEmail })

      if (!result.success) {
        setFieldErrors(result.fieldErrors ?? {})
        toast.error(result.message)
        return
      }

      toast.success(result.message)
      window.location.assign(result.redirectTo ?? "/")
    } catch {
      toast.error("Akun gagal dihapus.")
    } finally {
      setIsDeleting(false)
    }
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!PROFILE_AVATAR_MIME_TYPES.has(file.type)) {
      toast.error("Format gambar harus PNG, JPG, atau JPEG.")
      event.target.value = ""
      return
    }

    if (file.size > PROFILE_AVATAR_MAX_SIZE) {
      toast.error("Ukuran gambar maksimal 2 MB.")
      event.target.value = ""
      return
    }

    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current)
    }

    const objectUrl = URL.createObjectURL(file)
    avatarObjectUrlRef.current = objectUrl
    setAvatarFile(file)
    setAvatarPreview(objectUrl)
  }

  const usageItems = [
    {
      label: "Latihan",
      value: profile.plan.usage.practiceSessionsCount,
      limit: profile.plan.limits.practiceSessionsPerMonth,
    },
    {
      label: "Quiz",
      value: profile.plan.usage.quizSessionsCount,
      limit: profile.plan.limits.quizSessionsPerMonth,
    },
    {
      label: "Tryout",
      value: profile.plan.usage.tryoutSessionsCount,
      limit: profile.plan.limits.tryoutSessionsPerMonth,
    },
    {
      label: "Pembahasan AI",
      value: profile.plan.usage.aiExplanationSessionsCount,
      limit: profile.plan.limits.aiExplanationsPerMonth,
    },
  ]

  const deleteDisabled =
    deleteEmail.trim().toLowerCase() !== profile.user.email.toLowerCase()

  return (
    <main className="bg-background py-8 text-foreground sm:py-10">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Profil"
          subtitle="Kelola profil untuk memperbarui identitas akun, foto profil, dan akses belajar."
        />

        <Card className="border-primary/10 shadow-sm shadow-primary/5">
          <CardHeader className="gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="min-w-0">
              <CardTitle className="text-xl font-semibold">
                Status Plan
              </CardTitle>
              <CardDescription className="mt-1 leading-6">
                Pantau paket aktif dan penggunaan limit bulan ini.
              </CardDescription>
            </div>
            <Badge
              size="default"
              className="bg-primary/10 text-primary ring-1 ring-primary/15"
            >
              <ShieldCheckIcon data-icon="inline-start" />
              {profile.plan.name}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            {profile.plan.subscription ? (
              <div className="rounded-xl border border-primary/10 bg-primary/[0.03] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {profile.plan.description}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Periode penggunaan: {formatProfileDate(profile.plan.usage.period)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDaysIcon className="size-4" />
                    {`${formatProfileDate(profile.plan.subscription.startsAt)} - ${formatProfileDate(
                      profile.plan.subscription.endsAt,
                    )}`}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-3">
              {usageItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">
                      {item.label}
                    </p>
                    <p className="text-sm font-semibold text-primary">
                      {formatUsageLimit(item.value, item.limit)}
                    </p>
                  </div>
                  <Progress
                    value={getUsagePercent(item.value, item.limit)}
                    className="mt-3 h-1.5"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="mt-5">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                Informasi Pribadi
              </CardTitle>
              <CardDescription className="leading-6">
                Perbarui data profil yang digunakan untuk pengalaman belajar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                <FieldGroup className="grid gap-5">
                  <Field>
                    <FieldLabel htmlFor="name">Nama</FieldLabel>
                    <Input
                      id="name"
                      value={formValues.name}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                    <FieldError>{fieldErrors.name?.[0]}</FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      value={profile.user.email}
                      disabled
                      className="bg-muted/60"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="phoneNumber">WhatsApp</FieldLabel>
                    <Input
                      id="phoneNumber"
                      value={formValues.phoneNumber ?? ""}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          phoneNumber: event.target.value,
                        }))
                      }
                      placeholder="08xxxxxxxxxx"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                    <FieldError>{fieldErrors.phoneNumber?.[0]}</FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="birthDate">Tanggal Lahir</FieldLabel>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formValues.birthDate ?? ""}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          birthDate: event.target.value,
                        }))
                      }
                    />
                    <FieldError>{fieldErrors.birthDate?.[0]}</FieldError>
                  </Field>

                  <Field>
                    <FieldLabel>Jenis Kelamin</FieldLabel>
                    <Select
                      value={formValues.gender ?? "none"}
                      onValueChange={(value) =>
                        setFormValues((current) => ({
                          ...current,
                          gender:
                            value === "none"
                              ? null
                              : (value as "male" | "female"),
                        }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="none">Tidak Diisi</SelectItem>
                          <SelectItem value="male">Laki-Laki</SelectItem>
                          <SelectItem value="female">Perempuan</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FieldError>{fieldErrors.gender?.[0]}</FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="bio">Bio</FieldLabel>
                    <Textarea
                      id="bio"
                      value={formValues.bio ?? ""}
                      maxLength={PROFILE_BIO_MAX_LENGTH}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          bio: event.target.value,
                        }))
                      }
                      placeholder="Ceritakan target belajar atau fokus persiapanmu."
                      className="min-h-28 resize-y"
                      />
                    <FieldDescription>
                      Maksimal {PROFILE_BIO_MAX_LENGTH} karakter.
                    </FieldDescription>
                    <FieldError>{fieldErrors.bio?.[0]}</FieldError>
                  </Field>
                </FieldGroup>

                <div className="flex h-fit w-full flex-col items-center justify-start self-start rounded-2xl border border-dashed border-primary/20 bg-primary/[0.03] px-6 py-8 text-center">
                  <div className="flex size-28 items-center justify-center overflow-hidden rounded-full sm:size-[120px]">
                    <Avatar className="size-full">
                      <AvatarImage
                        src={avatarPreview ?? undefined}
                        alt={profile.user.name}
                      />
                      <AvatarFallback className="text-4xl font-semibold text-primary">
                        {getProfileInitials(formValues.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="sr-only"
                    onChange={handleAvatarChange}
                  />

                  <Button
                    type="button"
                    variant="outline-primary"
                    size="default"
                    className="mt-6"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImagePlusIcon data-icon="inline-start" />
                    Pilih Gambar
                  </Button>

                  <p className="mt-3 max-w-56 text-sm leading-6 text-muted-foreground">
                    Format PNG, JPG, atau JPEG dengan ukuran maksimal 2 MB.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <Button
                  type="submit"
                  size="default"
                  className="w-full sm:w-auto"
                  disabled={isSaving}
                >
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        <Card className="mt-5 border-destructive/20 bg-destructive/[0.03] shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-semibold text-destructive">
              <AlertTriangleIcon className="size-5" />
              Zona Berbahaya
            </CardTitle>
            <CardDescription className="leading-6">
              Hapus akun bersifat permanen dan tidak dapat dibatalkan.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Data akun, sesi latihan, tryout, pembayaran, dan progres milikmu
              akan dihapus. Konten administratif yang pernah dibuat akan tetap
              tersimpan tanpa referensi akun.
            </p>
            <Button
              type="button"
              variant="destructive-solid"
              size="default"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2Icon data-icon="inline-start" />
              Hapus Akun
            </Button>
          </CardContent>
        </Card>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Akun Permanen</AlertDialogTitle>
              <AlertDialogDescription>
                Untuk mengonfirmasi, ketik &quot;{profile.user.email}&quot; pada kotak di bawah.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangleIcon />
                <AlertTitle>Perhatian</AlertTitle>
                <AlertDescription>
                  Tindakan ini akan menghapus akun, sesi belajar, progres, dan data terkait secara permanen.
                </AlertDescription>
              </Alert>
              <Separator />
              <Field>
                <Input
                  id="delete-email"
                  value={deleteEmail}
                  onChange={(event) => setDeleteEmail(event.target.value)}
                  placeholder={profile.user.email}
                />
                <FieldError>{fieldErrors.email?.[0]}</FieldError>
              </Field>

            </div>

            <AlertDialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => {
                  setDeleteOpen(false)
                  setDeleteEmail("")
                }}
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive-solid"
                disabled={deleteDisabled || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? "Menghapus..." : "Hapus Akun"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </main>
  )
}
