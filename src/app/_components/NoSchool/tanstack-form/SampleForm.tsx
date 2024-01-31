'use client';
import { useCallback, useState } from 'react';
import { z } from 'zod';
import { Button, Modal, ModalRoot } from '@mui/material';
import { FieldApi } from '@tanstack/react-form';
import { TextArea } from '@/app/_components/NoSchool/tanstack-form/TextArea';
import { useFormTanstack } from '@/app/_components/NoSchool/tanstack-form/useFormControls';

function FieldInfo({ field }: { field: FieldApi<any, any, any, any> }) {
  return (
    <>
      {field.state.meta.touchedErrors ? <em>{field.state.meta.touchedErrors}</em> : null}
      {field.state.meta.isValidating ? 'Validating...' : null}
    </>
  );
}

const useDisclosure = (initial = false) => {
  const [isOpen, setIsOpen] = useState(initial);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((state) => !state), []);

  return { isOpen, open, close, toggle };
};

export const TanstackSampleForm = () => {
  const {
    handleSubmit,
    Provider,
    Field,
    state: { errors, isValid, isSubmitting },
    serverErrorMessage,
  } = useFormTanstack({
    schema: z.object({
      message: z
        .string()
        .min(150, { message: '150文字以上必須です' })
        .max(2000, { message: '内容は2000文字以内で入力してください' }),
    }),
    defaultValues: {
      message: '',
    },
    onSubmit: async (props) => {
      console.log(props.value.message);
      await post();
    },
  });

  const { open: openCompleteModal, isOpen, close } = useDisclosure();
  const closeCompleteModal = () => {
    close();
    location.reload();
  };

  const post = async () => {
    console.log('hoge');
  };

  return (
    <Provider>
      <form
        action={'javascript:void(0)'}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void handleSubmit();
        }}
      >
        <Modal open={isOpen} onClose={closeCompleteModal}>
          <ModalRoot>
            <></>
          </ModalRoot>
        </Modal>
        <div className={'mt-2'}>
          <Field name={'message'}>
            {(field) => {
              return (
                <>
                  <TextArea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldInfo field={field}></FieldInfo>
                </>
              );
            }}
          </Field>
        </div>
        <div className={'mt-2'}>
          {/*  isLoading={isSubmitting} isDisabled={!isValid || isSubmitting} */}
          <Button color={'primary'} variant={'contained'} disabled={!isValid || isSubmitting}>
            送信する
          </Button>
        </div>
      </form>
    </Provider>
  );
};
