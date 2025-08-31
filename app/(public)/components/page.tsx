'use client';

import React, { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardBody, CardFooter } from '@/components/ui/Card';
import { Input, Textarea, Select, Checkbox } from '@/components/ui/Input';
import { Modal, Dialog } from '@/components/ui/Modal';
import { Spinner, Loading, Skeleton, Progress } from '@/components/ui/Loading';
import { Alert, Toast, ToastProvider, useToast } from '@/components/ui/Alert';

const ComponentsShowcase: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(true);
  const [progress, setProgress] = useState(45);

  return (
    <ToastProvider>
      <ComponentShowcaseContent
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        isDialogOpen={isDialogOpen}
        setIsDialogOpen={setIsDialogOpen}
        showAlert={showAlert}
        setShowAlert={setShowAlert}
        progress={progress}
        setProgress={setProgress}
      />
    </ToastProvider>
  );
};

interface ComponentShowcaseContentProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;
  showAlert: boolean;
  setShowAlert: (show: boolean) => void;
  progress: number;
  setProgress: (progress: number) => void;
}

const ComponentShowcaseContent: React.FC<ComponentShowcaseContentProps> = ({
  isModalOpen,
  setIsModalOpen,
  isDialogOpen,
  setIsDialogOpen,
  showAlert,
  setShowAlert,
  progress,
  setProgress,
}) => {
  const { showToast } = useToast();

  const handleToastDemo = (type: 'info' | 'success' | 'warning' | 'error') => {
    showToast({
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Toast`,
      message: `This is a ${type} toast notification!`,
      duration: 3000,
    });
  };

  return (
    <Container className="py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          UI Components Library
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Comprehensive showcase of all available UI components
        </p>
      </div>

      <div className="space-y-16">
        {/* Buttons */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Buttons</h2>
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Variants</h3>
                  <div className="space-y-2">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="danger">Danger</Button>
                    <Button variant="success">Success</Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Sizes</h3>
                  <div className="space-y-2">
                    <Button size="xs">Extra Small</Button>
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                    <Button size="xl">Extra Large</Button>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">States</h3>
                  <div className="space-y-2">
                    <Button>Normal</Button>
                    <Button isLoading>Loading</Button>
                    <Button disabled>Disabled</Button>
                    <Button fullWidth>Full Width</Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* Cards */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card variant="default">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>This is a default card with border</CardDescription>
              </CardHeader>
              <CardBody>
                <p>Card content goes here.</p>
              </CardBody>
            </Card>

            <Card variant="shadow" hoverable>
              <CardHeader>
                <CardTitle>Shadow Card</CardTitle>
                <CardDescription>Hover me for interaction</CardDescription>
              </CardHeader>
              <CardBody>
                <p>This card has a shadow effect.</p>
              </CardBody>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="bordered">
              <CardHeader>
                <CardTitle>Bordered Card</CardTitle>
              </CardHeader>
              <CardBody>
                <p>Card with thick border.</p>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Form Components */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Form Components</h2>
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input
                    label="Text Input"
                    placeholder="Enter text"
                    helperText="This is helper text"
                  />
                  <Input
                    label="Input with Icon"
                    placeholder="Search..."
                    leftIcon={
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    }
                  />
                  <Input
                    label="Error State"
                    placeholder="Invalid input"
                    error="This field is required"
                  />
                  <Select
                    label="Select Option"
                    options={[
                      { value: 'option1', label: 'Option 1' },
                      { value: 'option2', label: 'Option 2' },
                      { value: 'option3', label: 'Option 3' },
                    ]}
                  />
                </div>
                <div className="space-y-4">
                  <Textarea
                    label="Textarea"
                    placeholder="Enter longer text"
                    rows={4}
                  />
                  <div className="space-y-2">
                    <Checkbox label="Checkbox Option 1" />
                    <Checkbox label="Checkbox Option 2" defaultChecked />
                    <Checkbox label="Checkbox Option 3" />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* Modals */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Modals & Dialogs</h2>
          <Card>
            <CardBody>
              <div className="flex gap-4">
                <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
                <Button onClick={() => setIsDialogOpen(true)} variant="secondary">
                  Open Dialog
                </Button>
              </div>
            </CardBody>
          </Card>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Example Modal"
            description="This is a modal description"
            size="md"
          >
            <p>This is the modal content. You can put any content here.</p>
            <div className="mt-4">
              <Button onClick={() => setIsModalOpen(false)}>Close</Button>
            </div>
          </Modal>

          <Dialog
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            title="Confirm Action"
            description="Are you sure you want to perform this action?"
            confirmText="Yes, Continue"
            cancelText="Cancel"
            confirmVariant="danger"
            onConfirm={() => {
              setIsDialogOpen(false);
              handleToastDemo('success');
            }}
          >
            <p>This action cannot be undone.</p>
          </Dialog>
        </section>

        {/* Loading Components */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Loading Components</h2>
          <Card>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Spinners</h3>
                  <div className="flex items-center gap-4">
                    <Spinner size="xs" />
                    <Spinner size="sm" />
                    <Spinner size="md" />
                    <Spinner size="lg" />
                    <Spinner size="xl" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Loading States</h3>
                  <Loading text="Loading data..." />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Skeletons</h3>
                  <div className="space-y-3">
                    <Skeleton variant="text" />
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="rectangular" width="100%" height="80px" />
                    <Skeleton variant="circular" width="40px" height="40px" />
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-3">Progress Bar</h3>
                <div className="space-y-4">
                  <Progress value={progress} showLabel />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setProgress(Math.max(0, progress - 10))}>
                      -10%
                    </Button>
                    <Button size="sm" onClick={() => setProgress(Math.min(100, progress + 10))}>
                      +10%
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>

        {/* Alerts & Toasts */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Alerts & Toasts</h2>
          <Card>
            <CardBody>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Alerts</h3>
                  <div className="space-y-4">
                    {showAlert && (
                      <Alert
                        type="info"
                        title="Information"
                        message="This is an informational alert."
                        onClose={() => setShowAlert(false)}
                      />
                    )}
                    <Alert
                      type="success"
                      title="Success"
                      message="Action completed successfully!"
                    />
                    <Alert
                      type="warning"
                      title="Warning"
                      message="Please review your settings."
                    />
                    <Alert
                      type="error"
                      title="Error"
                      message="Something went wrong. Please try again."
                    />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Toast Notifications</h3>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleToastDemo('info')}>
                      Info Toast
                    </Button>
                    <Button size="sm" onClick={() => handleToastDemo('success')}>
                      Success Toast
                    </Button>
                    <Button size="sm" onClick={() => handleToastDemo('warning')}>
                      Warning Toast
                    </Button>
                    <Button size="sm" onClick={() => handleToastDemo('error')}>
                      Error Toast
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </section>
      </div>
    </Container>
  );
};

export default ComponentsShowcase;