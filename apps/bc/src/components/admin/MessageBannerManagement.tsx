'use client'

import {
  deleteMessageBannerForManagement,
  saveMessageBannerForManagement,
} from '@/services/serverFunctions/messageBanner'
import type { MessageBannerCommand } from '@/services/serverFunctions/messageBanner.command'
import { useServerFunction } from '@abc-transitionbascarbone/common/components/hooks/useServerFunction'
import type { MessageBanner } from '@abc-transitionbascarbone/common/db'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, Switch, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import type { FormEvent } from 'react'
import { useState } from 'react'

type BannerForm = Omit<MessageBannerCommand, 'startAt' | 'endAt'> & {
  startAt: string
  endAt: string
}

const toDateTimeInputValue = (date: Date) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

const createEmptyBannerForm = (): BannerForm => {
  const startAt = new Date()
  const endAt = new Date(startAt.getTime() + 24 * 60 * 60 * 1000)
  return {
    message: '',
    environments: Object.values(Environment),
    startAt: toDateTimeInputValue(startAt),
    endAt: toDateTimeInputValue(endAt),
    active: true,
  }
}

interface Props {
  banners: MessageBanner[]
}

const MessageBannerManagement = ({ banners }: Props) => {
  const t = useTranslations('admin.messageBanners')
  const tEnvironment = useTranslations('environment')
  const { callServerFunction } = useServerFunction()
  const router = useRouter()
  const [form, setForm] = useState<BannerForm>(createEmptyBannerForm)

  const resetForm = () => setForm(createEmptyBannerForm())

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const command: MessageBannerCommand = {
      ...form,
      startAt: new Date(form.startAt),
      endAt: new Date(form.endAt),
    }

    await callServerFunction(() => saveMessageBannerForManagement(command), {
      onSuccess: () => {
        resetForm()
        router.refresh()
      },
    })
  }

  const edit = (banner: MessageBanner) => {
    setForm({
      id: banner.id,
      message: banner.message,
      environments: banner.environments,
      startAt: toDateTimeInputValue(banner.startAt),
      endAt: toDateTimeInputValue(banner.endAt),
      active: banner.active,
    })
  }

  const remove = async (id: string) => {
    if (!window.confirm(t('confirmDelete'))) {
      return
    }

    await callServerFunction(() => deleteMessageBannerForManagement(id), {
      onSuccess: () => {
        if (form.id === id) {
          resetForm()
        }
        router.refresh()
      },
    })
  }

  return (
    <section className="mt2 flex-col gapped1">
      <h2>{t('title')}</h2>
      <form onSubmit={save} className="flex-col gapped1">
        <TextField
          label={t('message')}
          value={form.message}
          onChange={(event) => setForm({ ...form, message: event.target.value })}
          multiline
          minRows={2}
          required
        />
        <FormControl component="fieldset">
          <FormLabel component="legend">{t('environments')}</FormLabel>
          <FormGroup row>
            {Object.values(Environment).map((environment) => (
              <FormControlLabel
                key={environment}
                control={
                  <Checkbox
                    checked={form.environments.includes(environment)}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        environments: event.target.checked
                          ? [...form.environments, environment]
                          : form.environments.filter((value) => value !== environment),
                      })
                    }
                  />
                }
                label={tEnvironment(environment)}
              />
            ))}
          </FormGroup>
        </FormControl>
        <div className="wrap gapped1">
          <TextField
            type="datetime-local"
            label={t('startAt')}
            value={form.startAt}
            onChange={(event) => setForm({ ...form, startAt: event.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            required
          />
          <TextField
            type="datetime-local"
            label={t('endAt')}
            value={form.endAt}
            onChange={(event) => setForm({ ...form, endAt: event.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
            required
          />
        </div>
        <FormControlLabel
          control={
            <Switch checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
          }
          label={t('active')}
        />
        <div className="align-center gapped1">
          <Button type="submit" variant="contained">
            {form.id ? t('update') : t('create')}
          </Button>
          {form.id && (
            <Button type="button" onClick={resetForm}>
              {t('cancel')}
            </Button>
          )}
        </div>
      </form>

      <h3>{t('existing')}</h3>
      {banners.length ? (
        <ul className="flex-col gapped1">
          {banners.map((banner) => (
            <li key={banner.id} className="flex-col gapped1">
              <strong>{banner.message}</strong>
              <span>
                {banner.environments.map((environment) => tEnvironment(environment)).join(', ')} ·{' '}
                {banner.active ? t('active') : t('inactive')}
              </span>
              <span>
                {toDateTimeInputValue(banner.startAt)} – {toDateTimeInputValue(banner.endAt)}
              </span>
              <div className="align-center gapped1">
                <Button type="button" onClick={() => edit(banner)}>
                  {t('edit')}
                </Button>
                <Button type="button" color="error" onClick={() => remove(banner.id)}>
                  {t('delete')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>{t('empty')}</p>
      )}
    </section>
  )
}

export default MessageBannerManagement
