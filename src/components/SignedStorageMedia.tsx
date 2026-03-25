import { useSignedUrl } from "@/hooks/useSignedUrl";

/** Renders a clickable link that resolves a signed URL from a storage path */
export const SignedLink = ({
  storagePath,
  bucket,
  children,
  className,
}: {
  storagePath: string;
  bucket?: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const url = useSignedUrl(storagePath, bucket);

  if (!url) return null;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
};

/** Renders an image that resolves a signed URL from a storage path */
export const SignedImage = ({
  storagePath,
  bucket,
  alt,
  className,
}: {
  storagePath: string;
  bucket?: string;
  alt: string;
  className?: string;
}) => {
  const url = useSignedUrl(storagePath, bucket);

  if (!url) return <div className={className} />;

  return <img src={url} alt={alt} className={className} />;
};
