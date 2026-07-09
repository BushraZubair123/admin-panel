import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { testimonialsApi } from '../../data/index.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import Card, { CardBody } from '../../components/common/Card.jsx';
import { FormField, Input, Textarea } from '../../components/common/FormField.jsx';
import Button from '../../components/common/Button.jsx';
import ToggleSwitch from '../../components/common/ToggleSwitch.jsx';
import ImageUploader from '../../components/common/ImageUploader.jsx';
import Spinner from '../../components/common/Spinner.jsx';

const schema = z.object({
  clientName: z.string().min(2, 'Client name is required'),
  company: z.string().optional().or(z.literal('')),
  photo: z.string().optional().or(z.literal('')),
  message: z.string().min(1, 'Testimonial message is required'),
  rating: z.coerce.number().int().min(1, 'Select a rating').max(5),
  isPublished: z.boolean(),
});

function RatingPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} aria-label={`${i} star${i > 1 ? 's' : ''}`}>
          <Star size={24} className={i <= value ? 'fill-cta text-cta' : 'text-border dark:text-border-dark'} />
        </button>
      ))}
    </div>
  );
}

export default function TestimonialForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existing, isLoading } = useQuery({
    queryKey: ['testimonials', id],
    queryFn: () => testimonialsApi.getOne(id),
    enabled: isEdit,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { clientName: '', company: '', photo: '', message: '', rating: 5, isPublished: false },
  });

  useEffect(() => {
    if (existing?.data) reset(existing.data);
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (values) => (isEdit ? testimonialsApi.update(id, values) : testimonialsApi.create(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast.success(isEdit ? 'Testimonial updated' : 'Testimonial created');
      navigate('/testimonials');
    },
    onError: (err) => toast.error(err.response?.data?.message || "Couldn't save the testimonial."),
  });

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => navigate('/testimonials')}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-body hover:text-heading dark:text-body-dark dark:hover:text-heading-dark"
      >
        <ArrowLeft size={15} /> Back to Testimonials
      </button>
      <PageHeader title={isEdit ? 'Edit Testimonial' : 'New Testimonial'} />

      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6" noValidate>
        <Card>
          <CardBody className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Client name" htmlFor="clientName" error={errors.clientName?.message} required>
                <Input id="clientName" error={!!errors.clientName} {...register('clientName')} />
              </FormField>
              <FormField label="Company" htmlFor="company">
                <Input id="company" {...register('company')} />
              </FormField>
            </div>

            <FormField label="Photo">
              <Controller
                name="photo"
                control={control}
                render={({ field }) => <ImageUploader value={field.value} onChange={field.onChange} label="Add photo" />}
              />
            </FormField>

            <FormField label="Testimonial message" htmlFor="message" error={errors.message?.message} required>
              <Textarea id="message" rows={4} error={!!errors.message} {...register('message')} />
            </FormField>

            <FormField label="Rating" error={errors.rating?.message} required>
              <Controller name="rating" control={control} render={({ field }) => <RatingPicker value={field.value} onChange={field.onChange} />} />
            </FormField>

            <Controller
              name="isPublished"
              control={control}
              render={({ field }) => (
                <ToggleSwitch checked={field.value} onChange={field.onChange} label={field.value ? 'Published' : 'Draft'} />
              )}
            />
          </CardBody>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate('/testimonials')}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
            <Save size={16} /> {isEdit ? 'Save changes' : 'Create testimonial'}
          </Button>
        </div>
      </form>
    </div>
  );
}
