export const WaiverDocument = ({ fullName }: { fullName: string }) => {
  const name = fullName?.trim() || "____________________";

  return (
    <div className="space-y-4">
      <h3 className="font-serif text-lg font-semibold text-foreground text-center mb-4">
        Equine Activity Release and Hold Harmless Agreement
      </h3>
      <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
        <p>
          1. I, <strong className="text-foreground">{name}</strong>, the undersigned understand, and freely and
          voluntarily enter into this Agreement with <strong className="text-foreground">Swan Hill Stables</strong>{" "}
          understanding that this Release and Hold Harmless Agreement is a waiver of any and all liability(ies).
        </p>
        <p>
          2. I understand the potential dangers that I could incur in mounting, riding, walking, boarding, feeding said
          horse; including, but not limited to, any interactions with other horses. Understanding those risks I hereby
          release that Company, its officers, directors, shareholders, employees and anyone else directly or indirectly
          connected with that Company from any liability whatsoever in the event of injury or damage of any nature (or
          perhaps even death) to me or anyone else caused by or incidental to my electing to mount and ride a horse owned
          or operated by Swan Hill Stables.
        </p>
        <p>
          4. I understand and recognize and warrant that this Release and Hold Harmless Agreement, is being voluntarily
          and intentionally signed and agreed to, and that in signing this Release and Hold Harmless Agreement I know and
          understand that this Release and Hold Harmless Agreement may further limit the liability of equine
          professionals to include any activity, whatsoever, involving an equine, including death, personal injury and/or
          damage to property.
        </p>
        <p>
          5. I recognize and agree that I know which equine professional(s) I will be working with, and acknowledge that
          I agree said equine professional(s) has/have made reasonable and prudent efforts to determine my ability to
          engage in the equine activity, and has/have sufficient knowledge of my equine and horseback riding skills as to
          relieve, release and hold harmless said equine professional(s) from any continuing duty to monitor my equine
          activities.
        </p>
        <p>
          6. I further voluntarily agree and warrant to Release and Hold Harmless this (these) equine professional(s)
          from any liability whatsoever, including, but not limited to, any incident caused by or related to said equine
          professional's (s') negligence, relating to injuries known, unknown, or otherwise not herein disclosed;
          including, but not limited to, injuries, death or property damage from: mounting; riding; dismounting; walking;
          grooming; feeding; use of horse barn, paddock, trails or horse ring, in any capacity; falling off horse whether
          horse is bucking, flipping, spooked; or my failure to understand any equine professional's directions relating
          to my riding or otherwise use and control, or lack thereof, of my horse or the horse I have been assigned to.
        </p>
      </div>
    </div>
  );
};
