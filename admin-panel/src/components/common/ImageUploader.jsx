import { useRef, useState } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { mediaApi } from '../../data/index.js';

/**
 * Single or multi-image uploader with progress + preview.
 * value: string URL (single mode) or string[] (multiple mode)
 * onChange: (newValue) => void
 */
export default function ImageUploader({ value, onChange, multiple = false, label = 'Upload image' }) {
  const inputRef = useRef(null);
  const [progress, setProgress] = useState(null);

  const urls = multiple ? value || [] : value ? [value] : [];

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList);
    for (const file of files) {
      try {
        setProgress(0);
        const { url } = await mediaApi.upload(file, setProgress);
        if (multiple) {
          onChange([...(value || []), url]);
        } else {
          onChange(url);
        }
      } catch {
        toast.error(`Couldn't upload ${file.name}. Try again.`);
      } finally {
        setProgress(null);
      }
    }
  };

  const removeAt = (idx) => {
    if (multiple) {
      const next = [...value];
      next.splice(idx, 1);
      onChange(next);
    } else {
      onChange('');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {urls.map((url, idx) => (
          <div key={url + idx} className="group relative h-24 w-24 overflow-hidden rounded-lg border border-border dark:border-border-dark">
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeAt(idx)}
              className="absolute right-1 top-1 rounded-full bg-slate-900/70 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {(multiple || urls.length === 0) && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-body/70 transition-colors hover:border-cta hover:text-cta dark:border-border-dark dark:text-body-dark/70"
          >
            {progress !== null ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span className="text-[10px]">{progress}%</span>
              </>
            ) : (
              <>
                <ImagePlus size={18} />
                <span className="text-[10px]">{label}</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple={multiple}
        className="hidden"
        onChange={(e) => e.target.files?.length && handleFiles(e.target.files)}
      />
    </div>
  );
}
