import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Short, plain-language terms shown before payment. */
const TermsDialog = ({ open, onOpenChange }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg bg-card">
      <DialogHeader>
        <DialogTitle className="netflix-title text-xl text-foreground">TERMS &amp; CONDITIONS</DialogTitle>
      </DialogHeader>
      <div className="space-y-3 text-xs md:text-sm text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">What you are paying for.</strong> StreamNetMirror is an access and support
          service. We find, test and maintain working links to streaming portals, live football streams and download
          tools, and we keep them refreshed for the length of your membership. You are paying for that work and for our
          support — not for the third-party sites themselves.
        </p>
        <p>
          <strong className="text-foreground">What is included.</strong> Your plan lists the categories it unlocks:
          NetMirror streaming (Netflix, Disney+, HBO Max and 50+ platforms), Live Sports (UEFA Champions League, Premier
          League, LaLiga, Bundesliga, Sky Sports Football and more) and Movie Downloads (links plus the software tools
          that make them work).
        </p>
        <p>
          <strong className="text-foreground">Links can change.</strong> Third-party links occasionally go down or move,
          especially for iPhone and browser users. When that happens, return to your dashboard for the refreshed link.
          Occasional lag or downtime is normal and is not grounds for a refund on its own.
        </p>
        <p>
          <strong className="text-foreground">Your safety.</strong> Never enter personal details, passwords or card
          information on a third-party streaming site. We do not control those sites and are not responsible for them.
        </p>
        <p>
          <strong className="text-foreground">Payments.</strong> Prices are set in USD and charged in your local currency
          at the day's exchange rate. A payment request expires after 10 minutes if it is not approved on your phone;
          you can simply start again. Refunds are available within 7 days of purchase — email shuvaegonera@gmail.com.
          Chargebacks may result in account suspension.
        </p>
        <p>
          <strong className="text-foreground">Accounts.</strong> One membership is for one household. Sharing your
          account widely may result in suspension without refund.
        </p>
      </div>
    </DialogContent>
  </Dialog>
);

export default TermsDialog;
