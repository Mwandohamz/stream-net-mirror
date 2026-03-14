import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, X, Phone, ChevronDown, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SUPPORTED_COUNTRIES, DEFAULT_COUNTRY, type Country } from "@/data/countries";
import { useExchangeRate } from "@/hooks/useExchangeRate";
import { useActiveConf, type ProviderConf } from "@/hooks/useActiveConf";
import { usePaymentStatus } from "@/hooks/usePaymentStatus";
import { initiateDeposit, predictProvider } from "@/lib/pawapay";
import { formatCurrencyAmount, roundForCurrency } from "@/lib/currency";
import { useAppSettings } from "@/hooks/useAppSettings";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (depositId: string) => void;
  onFailure: (depositId: string, reason: string) => void;
  userName: string;
  userEmail: string;
  promoCode?: string;
  discountPercent?: number;
}

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS = ["Amount", "Country", "Provider", "Phone", "Payment"];

export default function PaymentModal({ isOpen, onClose, onSuccess, onFailure, userName, userEmail, promoCode, discountPercent = 0 }: PaymentModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [selectedProvider, setSelectedProvider] = useState<ProviderConf | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [depositId, setDepositId] = useState<string | null>(null);
  const [depositError, setDepositError] = useState<string | null>(null);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [showRevival, setShowRevival] = useState(false);

  const { settings: appSettings, loading: settingsLoading } = useAppSettings();
  const baseAmountZMW = (() => {
    const raw = parseFloat(appSettings.base_price_zmw || "49") || 49;
    return discountPercent > 0 ? Math.round(raw * (1 - discountPercent / 100)) : raw;
  })();

  const { getUSDEquivalent, convertFromZMW, loading: ratesLoading, error: ratesError } = useExchangeRate();
  const { providers, loading: providersLoading, error: providersError } = useActiveConf(step >= 3 ? country.iso3 : "");
  const paymentResult = usePaymentStatus(step === 5 ? depositId : null);

  const usdAmount = getUSDEquivalent(baseAmountZMW);
  const localAmount = country.currency === "ZMW" ? baseAmountZMW : convertFromZMW(baseAmountZMW, country.currency);

  // Handle payment result
  useEffect(() => {
    if (paymentResult.status === "COMPLETED") {
      onSuccess(depositId!);
    } else if (paymentResult.status === "FAILED" || paymentResult.status === "TIMEOUT") {
      // stay on step 5 to show result
    }
  }, [paymentResult.status]);

  // Revival timer
  useEffect(() => {
    if (step === 5 && selectedProvider?.pinPromptRevivable) {
      const t = setTimeout(() => setShowRevival(true), 12000);
      return () => clearTimeout(t);
    }
  }, [step, selectedProvider]);

  const resetModal = () => {
    setStep(1);
    setCountry(DEFAULT_COUNTRY);
    setSelectedProvider(null);
    setPhoneNumber("");
    setPhoneError("");
    setDepositId(null);
    setDepositError(null);
    setShowRevival(false);
  };

  const handlePhoneBlur = async () => {
    if (phoneNumber.length < 6) return;
    const fullNumber = country.prefix.replace("+", "") + phoneNumber;
    try {
      const result = await predictProvider(fullNumber);
      if (result?.correspondent) {
        const match = providers.find((p) => p.correspondentId === result.correspondent);
        if (match && match.status === "OPERATIONAL") {
          setSelectedProvider(match);
        }
      }
      setPhoneError("");
    } catch {
      // don't block user
    }
  };

  const handlePay = async () => {
    if (!selectedProvider || !localAmount) return;

    const id = crypto.randomUUID();
    setDepositId(id);
    setDepositError(null);
    setStep(5);

    const fullPhone = country.prefix.replace("+", "") + phoneNumber;
    const amount = roundForCurrency(localAmount, country.currency);

    // Validate min/max
    const numAmount = parseFloat(amount);
    const min = parseFloat(selectedProvider.minAmount);
    const max = parseFloat(selectedProvider.maxAmount);
    if (numAmount < min || numAmount > max) {
      setDepositError(`Amount must be between ${selectedProvider.minAmount} and ${selectedProvider.maxAmount} ${country.currency}`);
      return;
    }

    try {
      const result = await initiateDeposit({
        depositId: id,
        amount,
        currency: country.currency,
        phoneNumber: fullPhone,
        provider: selectedProvider.correspondentId,
        name: userName,
        email: userEmail,
        country: country.iso3,
      });

      if (result?.status === "REJECTED") {
        setDepositError(result?.failureReason?.failureMessage ?? "Payment was rejected. Please try again.");
      } else if (result?.status === "DUPLICATE_IGNORED") {
        setDepositError("This payment reference was already used. Please close and try again.");
      }
    } catch (e: any) {
      setDepositError(e.message ?? "An error occurred. Please try again.");
    }
  };

  const isFinalState = paymentResult.status === "COMPLETED" || paymentResult.status === "FAILED" || paymentResult.status === "TIMEOUT" || !!depositError;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetModal(); onClose(); } }}>
      <DialogContent className="sm:max-w-md p-0 gap-0 bg-card border-border overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Progress bar */}
        <div className="flex gap-1 p-4 pb-0">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-1 w-full rounded-full transition-colors ${i + 1 <= step ? "bg-primary" : "bg-muted"}`} />
              <span className={`text-[10px] ${i + 1 <= step ? "text-primary" : "text-muted-foreground/50"}`}>{label}</span>
            </div>
          ))}
        </div>

        <div className="p-6 pt-4">
          <AnimatePresence mode="wait">
            {/* STEP 1: Amount */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {ratesLoading ? "Loading rates..." : usdAmount ? `≈ $${usdAmount.toFixed(2)} USD` : ""}
                  </p>
                  <p className="text-4xl font-bold text-foreground netflix-title">
                    {localAmount !== null ? formatCurrencyAmount(localAmount, country.currency) : "ZMW 49.00"}
                  </p>
                  {country.currency !== "ZMW" && (
                    <p className="text-xs text-muted-foreground">Converted from ZMW {baseAmountZMW} at live exchange rate</p>
                  )}
                  <p className="text-xs text-muted-foreground">One-time payment · Unlimited streaming access</p>
                </div>
                <Button onClick={() => setStep(2)} className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold">
                  Continue
                </Button>
              </motion.div>
            )}

            {/* STEP 2: Country */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ArrowLeft size={14} /> Back
                </button>
                <div>
                  <Label className="text-foreground text-sm mb-2 block">Select Your Country</Label>
                  <div className="relative">
                    <button
                      onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
                      className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-secondary text-foreground text-sm"
                    >
                      <span>{country.flag} {country.name} ({country.currency})</span>
                      <ChevronDown size={16} className={`text-muted-foreground transition-transform ${countryDropdownOpen ? "rotate-180" : ""}`} />
                    </button>
                    {countryDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {SUPPORTED_COUNTRIES.map((c) => (
                          <button
                            key={c.iso3}
                            onClick={() => { setCountry(c); setCountryDropdownOpen(false); setSelectedProvider(null); }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${c.iso3 === country.iso3 ? "bg-primary/10 text-primary" : "text-foreground"}`}
                          >
                            {c.flag} {c.name} ({c.currency})
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Updated amount preview */}
                <div className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">
                    {usdAmount ? `≈ $${usdAmount.toFixed(2)} USD` : ""}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {localAmount !== null ? formatCurrencyAmount(localAmount, country.currency) : "ZMW 49.00"}
                  </p>
                  {country.currency !== "ZMW" && (
                    <p className="text-[10px] text-muted-foreground mt-1">Converted from ZMW {baseAmountZMW} at live exchange rate</p>
                  )}
                </div>

                <Button onClick={() => setStep(3)} className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold">
                  Continue
                </Button>
              </motion.div>
            )}

            {/* STEP 3: Provider */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <button onClick={() => setStep(2)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ArrowLeft size={14} /> Back
                </button>
                <Label className="text-foreground text-sm block">Select Your Mobile Money Provider</Label>

                {providersLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-primary" size={24} />
                    <span className="ml-2 text-sm text-muted-foreground">Loading providers...</span>
                  </div>
                )}

                {providersError && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                    {providersError}
                  </div>
                )}

                {!providersLoading && !providersError && providers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No providers available for this country. The pawaPay API token may not be configured yet.</p>
                )}

                <div className="grid gap-2">
                  {providers.map((p) => {
                    const disabled = p.status === "CLOSED";
                    const selected = selectedProvider?.correspondentId === p.correspondentId;
                    return (
                      <button
                        key={p.correspondentId}
                        disabled={disabled}
                        onClick={() => setSelectedProvider(p)}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                          disabled
                            ? "border-border bg-muted/30 opacity-50 cursor-not-allowed"
                            : selected
                            ? "border-primary bg-primary/10"
                            : "border-border bg-secondary hover:border-muted-foreground/30"
                        }`}
                      >
                        {p.logo ? (
                          <img src={p.logo} alt={p.displayName} className="w-8 h-8 rounded object-contain bg-white p-0.5" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        ) : (
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                            {p.displayName.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{p.displayName}</p>
                          {disabled && <p className="text-[10px] text-muted-foreground">Currently unavailable</p>}
                        </div>
                        {selected && <Check size={16} className="text-primary" />}
                      </button>
                    );
                  })}
                </div>

                <Button
                  onClick={() => setStep(4)}
                  disabled={!selectedProvider}
                  className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold"
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {/* STEP 4: Phone */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <button onClick={() => setStep(3)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ArrowLeft size={14} /> Back
                </button>

                <div>
                  <Label className="text-foreground text-sm mb-2 block">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-3 bg-secondary border border-border rounded-lg text-sm text-muted-foreground min-w-fit">
                      <span>{country.flag}</span>
                      <span>{country.prefix}</span>
                    </div>
                    <div className="relative flex-1">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={phoneNumber}
                        onChange={(e) => { setPhoneNumber(e.target.value.replace(/\D/g, "")); setPhoneError(""); }}
                        onBlur={handlePhoneBlur}
                        placeholder="Phone number"
                        className="pl-9 bg-secondary border-border text-foreground"
                        type="tel"
                      />
                    </div>
                  </div>
                  {phoneError && <p className="text-xs text-destructive mt-1">{phoneError}</p>}
                </div>

                {/* Summary */}
                <div className="bg-muted/30 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="text-foreground font-medium">{localAmount !== null ? formatCurrencyAmount(localAmount, country.currency) : "ZMW 49.00"}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="text-foreground font-medium">{selectedProvider?.displayName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Country</span>
                    <span className="text-foreground font-medium">{country.flag} {country.name}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePay}
                  disabled={phoneNumber.length < 6}
                  className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/80 font-semibold text-base"
                >
                  Pay {localAmount !== null ? formatCurrencyAmount(localAmount, country.currency) : "ZMW 49"} Now
                </Button>
              </motion.div>
            )}

            {/* STEP 5: Processing / Result */}
            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 text-center">
                {/* SUCCESS */}
                {paymentResult.status === "COMPLETED" && (
                  <>
                    <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto">
                      <Check size={32} className="text-green-500" />
                    </div>
                    <h3 className="netflix-title text-2xl text-foreground">PAYMENT SUCCESSFUL! 🎉</h3>
                    <p className="text-sm text-muted-foreground">
                      {localAmount !== null ? formatCurrencyAmount(localAmount, country.currency) : "ZMW 49"} paid via {selectedProvider?.displayName}
                    </p>
                    {paymentResult.data?.providerTransactionId && (
                      <p className="text-xs text-muted-foreground">Ref: {paymentResult.data.providerTransactionId}</p>
                    )}
                    <Button onClick={() => { resetModal(); onSuccess(depositId!); }} className="w-full bg-primary text-primary-foreground hover:bg-primary/80">
                      Access Streaming Portal
                    </Button>
                  </>
                )}

                {/* FAILED / TIMEOUT */}
                {(paymentResult.status === "FAILED" || paymentResult.status === "TIMEOUT" || depositError) && (
                  <>
                    <div className="w-16 h-16 rounded-full bg-destructive/20 border-2 border-destructive flex items-center justify-center mx-auto">
                      <X size={32} className="text-destructive" />
                    </div>
                    <h3 className="netflix-title text-2xl text-foreground">PAYMENT FAILED</h3>
                    <p className="text-sm text-muted-foreground">
                      {depositError ?? paymentResult.error ?? "Something went wrong."}
                    </p>
                    <Button onClick={() => { setStep(3); setDepositId(null); setDepositError(null); }} variant="outline" className="w-full">
                      Try Again
                    </Button>
                  </>
                )}

                {/* PENDING */}
                {paymentResult.status === "PENDING" && !depositError && (
                  <>
                    <Loader2 size={40} className="text-primary animate-spin mx-auto" />
                    <h3 className="netflix-title text-xl text-foreground">AWAITING PAYMENT</h3>
                    <p className="text-sm text-muted-foreground">
                      Please check your phone and enter your mobile money PIN to complete the payment.
                    </p>
                    {selectedProvider?.nameDisplayedToCustomer && (
                      <p className="text-xs text-muted-foreground">
                        The payment will appear from: <strong>{selectedProvider.nameDisplayedToCustomer}</strong>
                      </p>
                    )}
                    {selectedProvider?.pinPrompt === "MANUAL" && selectedProvider.pinPromptInstructions && selectedProvider.pinPromptInstructions.length > 0 && (
                      <div className="bg-muted/30 rounded-lg p-3 text-left">
                        <p className="text-xs font-medium text-foreground mb-1">USSD Instructions:</p>
                        <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
                          {selectedProvider.pinPromptInstructions.map((inst, i) => (
                            <li key={i}>{inst}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                    {showRevival && selectedProvider?.revivalInstructions && selectedProvider.revivalInstructions.length > 0 && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-left">
                        <p className="text-xs font-medium text-primary mb-1">Didn't get the prompt? Try:</p>
                        <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal list-inside">
                          {selectedProvider.revivalInstructions.map((inst, i) => (
                            <li key={i}>{inst}</li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-4 pt-0 text-center">
          <p className="text-[10px] text-muted-foreground/40">Powered by pawaPay · Secure mobile money payments</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
