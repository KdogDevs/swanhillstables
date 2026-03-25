const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h5 className="font-semibold text-foreground mb-1 text-sm">{title}</h5>
    <ul className="list-disc pl-5 space-y-0.5 text-muted-foreground text-xs leading-relaxed">{children}</ul>
  </div>
);

export const BarnRulesDocument = ({ signerName, signatureData, signedDate }: { signerName?: string; signatureData?: string | null; signedDate?: string | null }) => {
  const displayDate = signedDate
    ? new Date(signedDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : null;

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <h3 className="font-serif text-lg font-semibold text-foreground">SWAN HILL STABLES</h3>
        <h4 className="font-serif text-base font-medium text-foreground">Barn Rules &amp; Safety Policies</h4>
      </div>

      <Section title="1. General Safety">
        <li>Helmets are required for participants under 18 at all times when mounted, no exceptions.</li>
        <li>Closed-toe shoes are required on the property. No sandals or flip-flops.</li>
        <li>No running, yelling, or roughhousing in the barn or around horses.</li>
        <li>Children under 12 must be supervised by an adult at all times.</li>
        <li>Do not approach or handle horses without permission.</li>
        <li>No stallions allowed on the property, no exceptions.</li>
      </Section>

      <Section title="2. Horse Handling">
        <li>Only assigned individuals may catch, groom, tack, or ride their horses.</li>
        <li>No feeding horses without owner or staff approval.</li>
        <li>Treats must be given flat-handed and approved by staff.</li>
        <li>Do not enter stalls or paddocks without permission.</li>
        <li>When putting horses in stalls or pastures turn them to face the gate/door before removing halter.</li>
        <li>Report any injuries, loose horses, or unsafe behavior immediately.</li>
      </Section>

      <Section title="3. Riding Rules">
        <li>Participants must sign a liability waiver before riding or interacting with horses.</li>
        <li>No riding without staff approval.</li>
      </Section>

      <Section title="4. Arena Etiquette">
        <li>Left shoulder to left shoulder when passing.</li>
        <li>Faster gaits have the right of way.</li>
        <li>No lunging in the main arena during lessons.</li>
        <li>Pick up manure after riding.</li>
        <li>Properly store equipment after use (ex. Jumps, barrels, lunge lines/whips)</li>
        <li>No spectators inside the arena unless approved.</li>
      </Section>

      <Section title="5. Tack & Equipment">
        <li>Use only your assigned tack unless permission is given.</li>
        <li>Return equipment clean and in its proper place.</li>
        <li>Do not adjust others' tack without permission.</li>
        <li>Report broken or unsafe equipment immediately.</li>
        <li>Keep tack and equipment in designated areas.</li>
      </Section>

      <Section title="6. Visitors & Guests">
        <li>All guests must check in with staff.</li>
        <li>No unsupervised guests or children.</li>
        <li>No dogs unless approved and on a leash.</li>
        <li>No smoking, vaping, drugs, or alcohol on property.</li>
      </Section>

      <Section title="7. Facility Rules">
        <li>Keep aisles clear at all times.</li>
        <li>Clean up after yourself and your horse.</li>
        <li>Dispose of trash properly.</li>
        <li>Do not use equipment without permission.</li>
        <li>Respect private areas and closed spaces.</li>
        <li>If a gate or door is opened, close it.</li>
      </Section>

      <Section title="8. Lesson Program">
        <li>Follow instructor directions at all times.</li>
        <li>Volunteers must be approved and trained.</li>
        <li>No photos or videos of clients without verbal consent.</li>
        <li>Maintain confidentiality and professionalism.</li>
      </Section>

      <Section title="9. Emergencies">
        <li>First aid kits are located in designated areas.</li>
        <li>Fire extinguishers must remain accessible.</li>
        <li>In case of emergency, follow staff instructions immediately.</li>
        <li>Emergency contact numbers are posted in the barn.</li>
      </Section>

      <Section title="10. Enforcement">
        <li>Failure to follow barn rules may result in:</li>
        <li>Loss of riding privileges</li>
        <li>Termination of lessons or board</li>
        <li>Removal from property without refund</li>
      </Section>

      {/* Signature Block */}
      {(signatureData || signerName) && (
        <div className="border-t border-border pt-4 mt-6 space-y-3 text-xs text-muted-foreground">
          <p>I have read and agree to abide by the Swan Hill Stables Barn Rules &amp; Safety Policies.</p>

          {signatureData ? (
            <div className="mt-2">
              <p className="text-[10px] text-muted-foreground mb-1">Signature:</p>
              <img src={signatureData} alt="Signature" className="max-h-20 border-b border-foreground/30" />
            </div>
          ) : (
            <div className="mt-2 border-b border-foreground/30 w-64 h-8" />
          )}

          {signerName && <p>Printed Name: <strong className="text-foreground">{signerName}</strong></p>}
          {displayDate && <p>Date: <strong className="text-foreground">{displayDate}</strong></p>}
        </div>
      )}
    </div>
  );
};
