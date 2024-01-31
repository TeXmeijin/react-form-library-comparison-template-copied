import { useCallback, useState } from 'react';
import { FormApi, useForm as useOriginalHook } from '@tanstack/react-form';
import { usePreventDirtyFormReload } from './usePreventDirtyFormReload';
import { isErrorResponse as isValidationError } from './errorResponseParser';
import type { z } from 'zod';
import axios from 'axios';
import { zodValidator } from '@tanstack/zod-form-adapter';

type FieldValues = Record<string, any>;

type FormProps<TFieldValues extends FieldValues> = {
  schema: z.ZodObject<TFieldValues>;
  defaultValues: z.baseObjectOutputType<TFieldValues>;
  onSubmit: (props: { value: TFieldValues; formApi: FormApi<TFieldValues, typeof zodValidator> }) => any;
  preventReload?: boolean;
};
type FormReturn<TFieldValues extends FieldValues> = {
  handleSubmit: FormApi<TFieldValues, typeof zodValidator>['handleSubmit'];
  serverErrorMessage: string;
  Field: FormApi<TFieldValues, typeof zodValidator>['Field'];
  state: FormApi<TFieldValues, typeof zodValidator>['state'];
  Provider: FormApi<TFieldValues, typeof zodValidator>['Provider'];
};

/**
 * @param schema
 * @param defaultValues
 * @param onSubmit
 * @param preventReload
 */
export function useFormTanstack<TFieldValues extends FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  preventReload = false,
}: FormProps<TFieldValues>): FormReturn<TFieldValues> {
  const [errorMessage, setErrorMessage] = useState('');
  const { isEnabled, enablePreventReload, disablePreventReload } = usePreventDirtyFormReload();

  const methods = useOriginalHook<TFieldValues, typeof zodValidator>({
    defaultValues,
    validatorAdapter: zodValidator,
    onSubmit: async (props) => {
      try {
        await onSubmit(props);
      } catch (error) {
        if (error instanceof Error) {
          onServerError(error);
        }
      }
    },
  });

  const onServerError = useCallback((error: Error) => {
    const defaultErrorMessage = 'エラーが発生しました。時間を空けて再度お試しください。';

    if (!axios.isAxiosError(error)) {
      setErrorMessage(defaultErrorMessage);
      return;
    }
    // バリデーションエラーの場合は、対応するフォーム要素にエラー内容をセット
    if (isValidationError(error)) {
      // 省略
      return;
    }

    // 以下割愛

    setErrorMessage(defaultErrorMessage);
  }, []);

  // preventReload=trueで且つ、フォーム入力中の場合にブラウザバックや画面リロードを防ぐ
  if (preventReload && !isEnabled && methods.state.isTouched) {
    enablePreventReload();
  }
  if (preventReload && isEnabled && !methods.state.isTouched) {
    disablePreventReload();
  }

  return {
    ...methods,
    Field: (p) => {
      // eslint-disable-next-line react/display-name
      return (
        <methods.Field
          {...p}
          validators={{
            onChange: schema.shape[p.name].parse,
          }}
        >
          {p.children}
        </methods.Field>
      );
    },
    serverErrorMessage: errorMessage,
  };
}
