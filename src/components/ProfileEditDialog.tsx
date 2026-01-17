import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, User, MapPin, AlertCircle, Stethoscope } from "lucide-react";

const profileSchema = z.object({
  full_name: z.string().trim().max(100, "Name must be less than 100 characters").optional(),
  phone: z.string().trim().max(20, "Phone must be less than 20 characters").optional(),
  address: z.string().trim().max(500, "Address must be less than 500 characters").optional(),
  emergency_contact_name: z.string().trim().max(100).optional(),
  emergency_contact_phone: z.string().trim().max(20).optional(),
  secondary_emergency_contact_name: z.string().trim().max(100).optional(),
  secondary_emergency_contact_phone: z.string().trim().max(20).optional(),
  preferred_vet_name: z.string().trim().max(100).optional(),
  preferred_vet_phone: z.string().trim().max(20).optional(),
  preferred_farrier_name: z.string().trim().max(100).optional(),
  preferred_farrier_phone: z.string().trim().max(20).optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    id: string;
    user_id: string;
    full_name: string | null;
    phone: string | null;
    address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
    secondary_emergency_contact_name?: string | null;
    secondary_emergency_contact_phone?: string | null;
    preferred_vet_name?: string | null;
    preferred_vet_phone?: string | null;
    preferred_farrier_name?: string | null;
    preferred_farrier_phone?: string | null;
    is_boarder?: boolean;
  } | null;
  onProfileUpdated: () => void;
}

const ProfileEditDialog = ({ open, onOpenChange, profile, onProfileUpdated }: ProfileEditDialogProps) => {
  const [saving, setSaving] = useState(false);
  const isBoarder = profile?.is_boarder ?? false;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      address: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      secondary_emergency_contact_name: "",
      secondary_emergency_contact_phone: "",
      preferred_vet_name: "",
      preferred_vet_phone: "",
      preferred_farrier_name: "",
      preferred_farrier_phone: "",
    },
  });

  useEffect(() => {
    if (profile && open) {
      form.reset({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || "",
        secondary_emergency_contact_name: profile.secondary_emergency_contact_name || "",
        secondary_emergency_contact_phone: profile.secondary_emergency_contact_phone || "",
        preferred_vet_name: profile.preferred_vet_name || "",
        preferred_vet_phone: profile.preferred_vet_phone || "",
        preferred_farrier_name: profile.preferred_farrier_name || "",
        preferred_farrier_phone: profile.preferred_farrier_phone || "",
      });
    }
  }, [profile, open, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: values.full_name || null,
          phone: values.phone || null,
          address: values.address || null,
          emergency_contact_name: values.emergency_contact_name || null,
          emergency_contact_phone: values.emergency_contact_phone || null,
          secondary_emergency_contact_name: values.secondary_emergency_contact_name || null,
          secondary_emergency_contact_phone: values.secondary_emergency_contact_phone || null,
          preferred_vet_name: values.preferred_vet_name || null,
          preferred_vet_phone: values.preferred_vet_phone || null,
          preferred_farrier_name: values.preferred_farrier_name || null,
          preferred_farrier_phone: values.preferred_farrier_phone || null,
        })
        .eq("id", profile.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      onProfileUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal information and emergency contacts
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Personal Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Address
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, City, State 12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Primary Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-accent" />
                Primary Emergency Contact
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="emergency_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emergency_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 987-6543" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Secondary Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                Secondary Emergency Contact
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="secondary_emergency_contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondary_emergency_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Horse Care Preferences - Only for Boarders */}
            {isBoarder && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-primary" />
                    Horse Care Preferences
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Provide your preferred veterinarian and farrier for your horse's care.
                  </p>
                  
                  <div className="space-y-4">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Preferred Veterinarian
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="preferred_vet_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vet Name / Clinic</FormLabel>
                            <FormControl>
                              <Input placeholder="Dr. Smith / ABC Equine" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="preferred_vet_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Vet Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Preferred Farrier
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="preferred_farrier_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Farrier Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John's Farrier Services" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="preferred_farrier_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Farrier Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 987-6543" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditDialog;
