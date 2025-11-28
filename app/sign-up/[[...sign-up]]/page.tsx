import { SignUp } from "@clerk/nextjs"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { Navbar } from "@/components/navbar"

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">
      <AnimatedBackground />
      <Navbar />
      <div className="flex-1 flex items-center justify-center pt-16 py-12">
        <SignUp appearance={{
          elements: {
            rootBox: "shadow-2xl shadow-primary/20 rounded-2xl",
            card: "backdrop-blur-xl bg-white/10 border border-white/10",
            headerTitle: "text-foreground",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton: "bg-white/5 border-white/10 text-foreground hover:bg-white/10",
            formFieldLabel: "text-foreground",
            formFieldInput: "bg-white/5 border-white/10 text-foreground",
            footerActionLink: "text-primary hover:text-primary/80"
          }
        }} />
      </div>
    </div>
  )
}
