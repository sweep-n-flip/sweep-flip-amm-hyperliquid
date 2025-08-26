"use client";
import React from "react";
import { Modal, ModalContent, ModalBody } from "@nextui-org/modal";

interface ModalComponentProps {
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function ModalComponent({
  children,
  isOpen,
  onOpenChange,
}: ModalComponentProps) {
  return (
    <Modal
      backdrop="blur"
      size="xl"
      placement="center"
      isOpen={isOpen}
      onOpenChange={onOpenChange}
    >
      <ModalContent>
        <ModalBody>{children}</ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default ModalComponent;
