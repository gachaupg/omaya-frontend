import React from "react";
import { useForm, SubmitHandler, FieldValues } from "react-hook-form";

interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "select" | "textarea";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string | number }[];
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

interface FormProps {
  fields: FormField[];
  onSubmit: SubmitHandler<FieldValues>;
  submitButtonText?: string;
  className?: string;
}

const Form: React.FC<FormProps> = ({
  fields,
  onSubmit,
  submitButtonText = "Submit",
  className = "",
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const renderField = (field: FormField) => {
    const commonProps = {
      ...register(field.name, {
        required: field.required,
        pattern: field.validation?.pattern,
        min: field.validation?.min,
        max: field.validation?.max,
        minLength: field.validation?.minLength,
        maxLength: field.validation?.maxLength,
      }),
      placeholder: field.placeholder,
      className:
        "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
    };

    switch (field.type) {
      case "select":
        return (
          <select {...commonProps}>
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case "textarea":
        return <textarea {...commonProps} rows={4} />;
      default:
        return <input type={field.type} {...commonProps} />;
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`space-y-4 ${className}`}
    >
      {fields.map((field) => (
        <div key={field.name} className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {renderField(field)}
          {errors[field.name] && (
            <p className="text-red-500 text-sm mt-1">
              {errors[field.name]?.message as string}
            </p>
          )}
        </div>
      ))}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {submitButtonText}
      </button>
    </form>
  );
};

export default Form;
