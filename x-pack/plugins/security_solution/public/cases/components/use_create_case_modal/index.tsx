/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Case } from '../../containers/types';
import { CreateCaseModal } from './create_case_modal';

interface Props {
  onCaseCreated: (theCase: Case) => void;
}
export interface UseAllCasesModalReturnedValues {
  Modal: React.FC;
  isModalOpen: boolean;
  closeModal: () => void;
  openModal: () => void;
}

export const useCreateCaseModal = ({ onCaseCreated }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const closeModal = useCallback(() => setIsModalOpen(false), []);
  const openModal = useCallback(() => setIsModalOpen(true), []);

  const Modal: React.FC = useCallback(
    () =>
      isModalOpen ? (
        <CreateCaseModal onCloseCaseModal={closeModal} onCaseCreated={onCaseCreated} />
      ) : null,
    [closeModal, isModalOpen, onCaseCreated]
  );

  const state = useMemo(
    () => ({
      Modal,
      isModalOpen,
      closeModal,
      openModal,
    }),
    [isModalOpen, closeModal, openModal, Modal]
  );

  return state;
};
