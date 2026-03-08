import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const formSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Valid email is required").max(255),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  age: z.coerce.number().int().min(3, "Must be at least 3").max(120).optional().or(z.literal(undefined as unknown as number)),
  experience_level: z.enum(["beginner", "novice", "intermediate", "advanced"]),
  horse_preference: z.enum(["school_horse", "own_horse"]),
  own_horse_name: z.string().trim().max(100).optional().or(z.literal("")),
  goals: z.string().trim().max(1000).optional().or(z.literal("")),
  preferred_days: z.array(z.string()).min(1, "Select at least one day"),
  preferred_time: z.enum(["morning", "afternoon", "evening", "flexible"]),
  emergency_contact_name: z.string().trim().min(1, "Emergency contact name is required").max(100),
  emergency_contact_phone: z.string().trim().min(1, "Emergency contact phone is required").max(20),
  special_needs: z.string().trim().max(1000).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export const LessonSignupForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      experience_level: "beginner",
      horse_preference: "school_horse",
      own_horse_name: "",
      goals: "",
      preferred_days: [],
      preferred_time: "flexible",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      special_needs: "",
    },
  });

  const horsePreference = form.watch("horse_preference");

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("lesson_signups").insert({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone || null,
        age: data.age || null,
        experience_level: data.experience_level,
        horse_preference: data.horse_preference,
        own_horse_name: data.own_horse_name || null,
        goals: data.goals || null,
        preferred_days: data.preferred_days,
        preferred_time: data.preferred_time,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        special_needs: data.special_needs || null,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
        <h2 className="font-serif text-3xl font-semibold text-foreground mb-4">
          Application Received!
        </h2>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Thank you for your interest in lessons at Swan Hill Stables. We'll be in touch soon to schedule your first ride.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Info */}
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              Personal Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@example.com" {...field} />
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
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rider's Age</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="12" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Riding Experience */}
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              Riding Experience
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="experience_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Level *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner — Never ridden</SelectItem>
                        <SelectItem value="novice">Novice — A few rides</SelectItem>
                        <SelectItem value="intermediate">Intermediate — Comfortable at all gaits</SelectItem>
                        <SelectItem value="advanced">Advanced — Competitive experience</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="horse_preference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horse *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="school_horse">Use a school horse</SelectItem>
                        <SelectItem value="own_horse">Bring my own horse</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {horsePreference === "own_horse" && (
              <FormField
                control={form.control}
                name="own_horse_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horse's Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your horse's name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Riding Goals</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What would you like to achieve? (e.g., trail riding, jumping, dressage, general horsemanship)"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Scheduling */}
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              Scheduling Preferences
            </h2>
            <FormField
              control={form.control}
              name="preferred_days"
              render={() => (
                <FormItem>
                  <FormLabel>Preferred Days *</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    {daysOfWeek.map((day) => (
                      <FormField
                        key={day}
                        control={form.control}
                        name="preferred_days"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(day)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, day]);
                                  } else {
                                    field.onChange(field.value.filter((d) => d !== day));
                                  }
                                }}
                              />
                            </FormControl>
                            <Label className="text-sm font-normal cursor-pointer">{day}</Label>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferred_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Time *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="morning">Morning (8am–12pm)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12pm–5pm)</SelectItem>
                      <SelectItem value="evening">Evening (5pm–8pm)</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Emergency & Special Needs */}
          <div className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              Emergency Contact
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emergency_contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                    <FormLabel>Contact Phone *</FormLabel>
                    <FormControl>
                      <Input placeholder="(555) 987-6543" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="special_needs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Needs or Accommodations</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any allergies, physical limitations, or other things we should know about?"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </Form>
    </motion.div>
  );
};
