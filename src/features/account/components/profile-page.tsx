"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  ImagePlusIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

type ActiveSubscription =
  AccountProfileData["plan"]["activeSubscriptions"][number]

type SubscriptionUsageItem = {
  label: string
  value: number
  limit: number
}

function getSubscriptionUsageItems(
  subscription: ActiveSubscription,
): SubscriptionUsageItem[] {
  return [
    {
      label: "Latihan",
      value: subscription.usage.practiceSessionsCount,
      limit: subscription.limits.practiceSessionsPerMonth,
    },
    {
      label: "Quiz",
      value: subscription.usage.quizSessionsCount,
      limit: subscription.limits.quizSessionsPerMonth,
    },
    {
      label: "Tryout",
      value: subscription.usage.tryoutSessionsCount,
      limit: subscription.limits.tryoutSessionsPerMonth,
    },
    {
      label: "Pembahasan AI",
      value: subscription.usage.aiExplanationSessionsCount,
      limit: subscription.limits.aiExplanationsPerMonth,
    },
  ]
}

export function ProfilePage({ profile }: ProfilePageProps) {
  const router = useRouter()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const subscriptionTrackRef = React.useRef<HTMLDivElement>(null)
  const avatarObjectUrlRef = React.useRef<string | null>(null)
  const subscriptionDragStateRef = React.useRef({
    pointerId: -1,
    isDragging: false,
    hasMoved: false,
    startX: 0,
    startScrollLeft: 0,
  })
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
  const [selectedSubscriptionId, setSelectedSubscriptionId] =
    React.useState<number | null>(null)

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

  const activeSubscriptions = profile.plan.activeSubscriptions
  const selectedSubscription =
    activeSubscriptions.find(
      (subscription) => subscription.id === selectedSubscriptionId,
    ) ?? null
  const selectedUsageItems = selectedSubscription
    ? getSubscriptionUsageItems(selectedSubscription)
    : []
  const deleteDisabled =
    deleteEmail.trim().toLowerCase() !== profile.user.email.toLowerCase()

  function handleSubscriptionPointerDown(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return
    }

    const track = subscriptionTrackRef.current

    if (!track) {
      return
    }

    subscriptionDragStateRef.current = {
      pointerId: event.pointerId,
      isDragging: true,
      hasMoved: false,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
    }

    track.setPointerCapture(event.pointerId)
  }

  function handleSubscriptionPointerMove(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    const dragState = subscriptionDragStateRef.current

    if (!dragState.isDragging || dragState.pointerId !== event.pointerId) {
      return
    }

    const track = subscriptionTrackRef.current

    if (!track) {
      return
    }

    const deltaX = event.clientX - dragState.startX

    if (Math.abs(deltaX) > 4) {
      dragState.hasMoved = true
    }

    track.scrollLeft = dragState.startScrollLeft - deltaX
    event.preventDefault()
  }

  function endSubscriptionPointerDrag(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    const dragState = subscriptionDragStateRef.current

    if (dragState.pointerId !== event.pointerId) {
      return
    }

    const track = subscriptionTrackRef.current

    if (track?.hasPointerCapture(event.pointerId)) {
      track.releasePointerCapture(event.pointerId)
    }

    subscriptionDragStateRef.current = {
      pointerId: -1,
      isDragging: false,
      hasMoved: false,
      startX: 0,
      startScrollLeft: 0,
    }
  }

  function handleSubscriptionClickCapture(
    event: React.MouseEvent<HTMLDivElement>,
  ) {
    if (!subscriptionDragStateRef.current.hasMoved) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    subscriptionDragStateRef.current.hasMoved = false
  }

  function handleSubscriptionSelect(subscriptionId: number) {
    setSelectedSubscriptionId(subscriptionId)
  }

  return (
    <main className="bg-background py-8 text-foreground sm:py-10">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Profil"
          subtitle="Kelola profil untuk memperbarui identitas akun, foto profil, dan akses belajar."
        />

        {activeSubscriptions.length > 0 ? (
          <section>
            <div
              ref={subscriptionTrackRef}
              className="-mx-4 grid auto-cols-[82%] grid-flow-col items-start gap-3 overflow-x-auto px-4 pb-2 pt-1 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] sm:auto-cols-[46%] lg:mx-0 lg:px-0 lg:auto-cols-[380px] md:cursor-grab md:select-none md:active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
              onPointerDown={handleSubscriptionPointerDown}
              onPointerMove={handleSubscriptionPointerMove}
              onPointerUp={endSubscriptionPointerDrag}
              onPointerCancel={endSubscriptionPointerDrag}
              onClickCapture={handleSubscriptionClickCapture}
            >
              {activeSubscriptions.map((subscription) => (
                <Card
                  key={subscription.id}
                  role="button"
                  tabIndex={0}
                  size="sm"
                  className="w-full self-start snap-start cursor-pointer border border-primary/10 shadow-sm shadow-primary/5 transition-colors hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  onClick={() => handleSubscriptionSelect(subscription.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault()
                      handleSubscriptionSelect(subscription.id)
                    }
                  }}
                >
                  <CardHeader className="gap-2 pb-0 sm:grid-cols-[1fr_auto] sm:items-start">
                    <div className="min-w-0">
                      <CardTitle className="truncate">
                        {subscription.examTypeName}
                      </CardTitle>
                    </div>
                    <CardAction>
                      <Badge
                        variant="soft"
                        className="bg-primary/10 text-primary ring-1 ring-primary/15"
                      >
                        Aktif
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-md border border-border bg-muted/30 px-2.5 py-2">
                        <p className="text-[11px] font-medium text-muted-foreground">
                          Mulai
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-foreground">
                          {formatProfileDate(subscription.startsAt)}
                        </p>
                      </div>
                      <div className="rounded-md border border-border bg-muted/30 px-2.5 py-2">
                        <p className="text-[11px] font-medium text-muted-foreground">
                          Berakhir
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-foreground">
                          {formatProfileDate(subscription.endsAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
                      <span>Penggunaan bulan ini</span>
                      <ChevronRightIcon className="size-3.5" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        <Dialog
          open={Boolean(selectedSubscription)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedSubscriptionId(null)
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            {selectedSubscription ? (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedSubscription.examTypeName}</DialogTitle>
                  <DialogDescription>
                    {formatProfileDate(selectedSubscription.startsAt)} -{" "}
                    {formatProfileDate(selectedSubscription.endsAt)}. Periode
                    penggunaan {formatProfileDate(selectedSubscription.usage.period)}.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedUsageItems.map((item) => {
                    const hasLimit = item.limit >= 0
                    const remaining = Math.max(item.limit - item.value, 0)

                    return (
                      <div
                        key={item.label}
                        className="rounded-lg border border-border bg-background p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">
                              {item.label}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {hasLimit
                                ? `Sisa ${remaining} sesi`
                                : "Tanpa batas bulanan"}
                            </p>
                          </div>
                          <p className="shrink-0 text-xs font-semibold text-primary">
                            {formatUsageLimit(item.value, item.limit)}
                          </p>
                        </div>
                        <Progress
                          value={getUsagePercent(item.value, item.limit)}
                          className="mt-3 h-1.5"
                        />
                      </div>
                    )
                  })}
                </div>
              </>
            ) : null}
          </DialogContent>
        </Dialog>

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
