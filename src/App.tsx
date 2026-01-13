import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "@phosphor-icons/react"

function App() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Playwright Render Test</CardTitle>
                    <CardDescription>Testing if the app renders correctly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Check className="text-green-600" weight="bold" />
                        <span>React is rendering</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="text-green-600" weight="bold" />
                        <span>Shadcn components working</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="text-green-600" weight="bold" />
                        <span>Phosphor icons loading</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Check className="text-green-600" weight="bold" />
                        <span>Tailwind styles applied</span>
                    </div>
                    <Button className="w-full" id="test-button">
                        All Systems Go! ✓
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

export default App