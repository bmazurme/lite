
import { Check, Picture, Xmark } from '@gravity-ui/icons';
import { MarkdownEditorView, useMarkdownEditor } from '@gravity-ui/markdown-editor';
import { Mermaid } from '@gravity-ui/markdown-editor/extensions/additional/Mermaid/index.js';
import {
  Button, Select, TextInput, Text, Icon, Checkbox,
} from '@gravity-ui/uikit';
import { useCallback, useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../hooks';
import { toaster } from '../../main';
import {
  setTags,
  setTypes,
  tagsSelector,
  typesSelector,
  useGetTagsMutation,
  useGetTypesMutation,
  useUploadImageMutation,
  type NoteResponse,
} from '../../store';
import RelatedNotesInput from '../related-notes-input/related-notes-input';
import TagsInput from '../tags-input/tags-input';

import { type FormPayload } from './edit-form-payload';
import style from './edit-form.module.css';
import fields from './form.fields';
import { TEXT_INPUT_PROPS } from './text-input-props';


/**
 * Подгружает подготовленный mermaid-runtime от diplodoc. Он через
 * window.mermaidJsonp передаёт инстанс mermaid в NodeView расширения,
 * который рендерит диаграммы прямо в WYSIWYG. Динамический import держит
 * тяжёлый mermaid вне основного бандла — грузится только при открытии редактора.
 */
const loadMermaidRuntime = () => {
  import('@diplodoc/mermaid-extension/runtime');
};

/** Читаемая дата последней проверки для редактора (напр. «22 июля 2026 г.»). */
const formatReviewDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

interface EditLayoutProps {
  title: string;
  data?: NoteResponse;
  action: (formData: FormPayload) => Promise<void>;
}

export default function EditForm({ title, data, action }: EditLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [getTypes, { isLoading }] = useGetTypesMutation();
  const [getTags] = useGetTagsMutation();
  const [uploadImage] = useUploadImageMutation();
  const types = useAppSelector(typesSelector);
  const tags = useAppSelector(tagsSelector);
  const {
    control, handleSubmit, register, setValue, formState: { errors },
  } = useForm<FormPayload>({
    defaultValues: {
      title: data?.title || '',
      type: data?.type?.name || '',
      preview: data?.preview || '',
      content: data?.content || '',
      coverImage: data?.coverImage || '',
      tags: data?.tags?.map((tag) => tag.name) || [],
      relatedNoteIds: data?.relatedNotes?.map((note) => note.id) || [],
      published: data?.published ?? false,
      reviewedAt: data?.reviewedAt ?? null,
    },
  });

  /**
   * Загружает изображение в object store и возвращает URL для вставки в
   * markdown. Передаётся редактору как handlers.uploadFile — срабатывает при
   * загрузке с устройства, drag-n-drop и вставке из буфера.
   */
  const uploadFileHandler = useCallback(
    async (file: File) => {
      try {
        const { url, name } = await uploadImage(file).unwrap();
        return { url, name };
      } catch {
        toaster.add({
          name: 'upload-image-error',
          title: 'Не удалось загрузить изображение',
          theme: 'danger',
        });
        throw new Error('Upload failed');
      }
    },
    [uploadImage],
  );

  const coverImageInputRef = useRef<HTMLInputElement>(null);

  /**
   * Обложка заметки (og:image / twitter:image на странице заметки). Хранится
   * как абсолютный URL, который возвращает /uploads/image — тот же формат,
   * что и картинки внутри содержимого.
   */
  const handleCoverImageChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;

      try {
        const { url } = await uploadImage(file).unwrap();
        setValue('coverImage', url, { shouldDirty: true });
      } catch {
        toaster.add({
          name: 'upload-cover-error',
          title: 'Не удалось загрузить обложку',
          theme: 'danger',
        });
      }
    },
    [uploadImage, setValue],
  );

  const canGoBack = location.key !== 'default';
  const handleBack = useCallback(() => {
      if (canGoBack) {
        navigate(-1);
      } else {
        navigate('/');
      }
    }, [navigate, canGoBack]);

  const contentEditor = useMarkdownEditor({
    initial: {
      markup: data?.content || '',
    },
    md: { html: false },
    handlers: {
      uploadFile: uploadFileHandler,
    },
    wysiwygConfig: {
      // Расширение Mermaid: блоки ```mermaid парсятся и рендерятся диаграммой.
      extensions: (builder) =>
        builder.use(Mermaid, { loadRuntimeScript: loadMermaidRuntime }),
    },
  });
  const previewEditor = useMarkdownEditor({
    initial: {
      markup: data?.preview || '',
    },
    md: { html: false },
    handlers: {
      uploadFile: uploadFileHandler,
    },
  });

  useEffect(() => {
    const updateFormValues = () => {
      setValue('preview', previewEditor.getValue());
      setValue('content', contentEditor.getValue());
    };

    const handleChange = () => updateFormValues();

    previewEditor.on('change', handleChange);
    contentEditor.on('change', handleChange);

    return () => {
      previewEditor.off('change', handleChange);
      contentEditor.off('change', handleChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, setValue]);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const types = await getTypes().unwrap();
        dispatch(setTypes(types));
      } catch {
        toaster.add({ name: 'fetch-types-form-error', title: 'Не удалось загрузить типы', theme: 'danger' });
      }
    };

    const fetchTags = async () => {
      try {
        const tags = await getTags().unwrap();
        dispatch(setTags(tags));
      } catch {
        // Подсказки по тегам необязательны — молча игнорируем ошибку.
      }
    };

    fetchTypes();
    fetchTags();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form
      className={style.form}
      aria-label={title}
      onSubmit={handleSubmit(action)}
    >
      <div className={style.header}>
        <Text variant="subheader-1">
          {title}
        </Text>
        <div className={style.tools}>
          <Button
            view="flat"
            size="s"
            onClick={handleBack}
          >
            Cancel
          </Button>
          <Button
            view="action"
            size="s"
            type="submit"
          >
            Save
          </Button>
        </div>
      </div>
      {fields.map((input) => (
        <Controller
          key={input.name}
          name={input.name as keyof FormPayload}
          rules={{
            pattern: input.pattern,
            required: input.required,
          }}
          control={control}
          render={({ field, fieldState }) => (
            field.name !== 'type'
              ? (
                <TextInput
                  {...field}
                  {...input}
                  {...TEXT_INPUT_PROPS}
                  value={typeof field.value === 'string' ? field.value : ''}
                  error={fieldState.error?.message}
                  aria-required={!!input.required}
                  aria-invalid={!!fieldState.error}
                />
              )
              : (
                <Select
                  label="Тип заметки"
                  size="l"
                  width="max"
                  {...register}
                  onUpdate={field.onChange}
                  defaultValue={typeof field.value === 'string' && field.value ? [field.value] : []}
                  errorMessage={fieldState.error?.message}
                  validationState={errors?.type ? 'invalid' : undefined}
                  placeholder={isLoading ? 'Загрузка...' : 'Выберите вариант'}
                  disabled={isLoading}
                  aria-required={true}
                  aria-invalid={!!errors?.type}
                  options={types.map(({ id, name }) => ({ id, value: id.toString(), content: name }))}
                />
              )
          )}
        />
      ))}
      <Controller
        name="coverImage"
        control={control}
        render={({ field }) => (
          <div className={style.cover}>
            <Text
              variant="subheader-2"
              className={style.coverLabel}
            >
              Обложка
            </Text>
            {field.value
              ? (
                <div className={style.coverPreview}>
                  <img
                    src={field.value}
                    alt="Обложка заметки"
                    className={style.coverImg}
                  />
                  <Button
                    view="outlined-danger"
                    size="s"
                    onClick={() => setValue('coverImage', '', { shouldDirty: true })}
                    aria-label="Удалить обложку"
                  >
                    <Icon
                      data={Xmark}
                      size={14}
                      aria-hidden="true"
                    />
                    Удалить
                  </Button>
                </div>
              )
              : (
                <Button
                  view="outlined"
                  size="s"
                  onClick={() => coverImageInputRef.current?.click()}
                >
                  <Icon
                    data={Picture}
                    size={14}
                    aria-hidden="true"
                  />
                  Загрузить обложку
                </Button>
              )}
            <input
              ref={coverImageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              className={style.coverInput}
              aria-hidden="true"
              tabIndex={-1}
              onChange={handleCoverImageChange}
            />
          </div>
        )}
      />
      <div className={style.divider} />

      <div className={style.field}>
        <Text
          variant="subheader-2"
          className={style.fieldLabel}
        >
          Аннотация
        </Text>
        <Text className={style.fieldHint}>
          Короткое превью для карточки заметки и SEO-описания.
        </Text>
        <MarkdownEditorView
          stickyToolbar
          autofocus
          editor={previewEditor}
          className={style.preview}
        />
      </div>

      <div className={style.field}>
        <Text
          variant="subheader-2"
          className={style.fieldLabel}
        >
          Содержание
        </Text>
        <Text className={style.fieldHint}>
          Основной текст заметки. Поддерживаются markdown, изображения, mermaid-диаграммы и вики-ссылки [[…]].
        </Text>
        <MarkdownEditorView
          stickyToolbar
          editor={contentEditor}
          className={style.content}
        />
      </div>

      <div className={style.divider} />

      <Controller
        name="tags"
        control={control}
        render={({ field }) => (
          <TagsInput
            value={Array.isArray(field.value) ? field.value : []}
            onChange={field.onChange}
            suggestions={tags}
          />
        )}
      />
      <Controller
        name="relatedNoteIds"
        control={control}
        render={({ field }) => (
          <RelatedNotesInput
            value={Array.isArray(field.value) ? field.value : []}
            onChange={field.onChange}
            initialSelected={data?.relatedNotes}
            excludeId={data?.id}
          />
        )}
      />
      <Controller
        name="published"
        control={control}
        render={({ field }) => (
          <Checkbox
            checked={!!field.value}
            onUpdate={field.onChange}
            size="l"
          >
            Опубликовано
          </Checkbox>
        )}
      />
      <Controller
        name="reviewedAt"
        control={control}
        render={({ field }) => {
          const value = typeof field.value === 'string' ? field.value : null;
          return (
            <div className={style.field}>
              <Text
                variant="subheader-2"
                className={style.fieldLabel}
              >
                Проверка актуальности
              </Text>
              <div className={style.reviewRow}>
                <Text color="secondary">
                  {value
                    ? `Последняя проверка: ${formatReviewDate(value)}`
                    : 'Заметка ещё не проверялась'}
                </Text>
                <div className={style.reviewActions}>
                  <Button
                    view="outlined-action"
                    size="s"
                    onClick={() => field.onChange(new Date().toISOString())}
                  >
                    <Icon
                      data={Check}
                      size={14}
                      aria-hidden="true"
                    />
                    Проверено сегодня
                  </Button>
                  {value && (
                    <Button
                      view="flat-danger"
                      size="s"
                      onClick={() => field.onChange(null)}
                    >
                      Сбросить
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        }}
      />
    </form>
  );
};
