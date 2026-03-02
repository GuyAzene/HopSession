import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/event/$eventId')({
  component: RouteComponent,
})

function RouteComponent() {
    const { eventId } = Route.useParams()

    return (
        <div className="flex flex-col gap-6 mt-8">
            <h2 className="text-3xl font-bold text-brand-text">ברוכים הבאים לסשן!</h2>
            <p className="text-brand-text/70">
                מזהה האירוע (ID) שלכם הוא: <code className="bg-white/50 px-2 py-1 rounded text-left" dir="ltr">{eventId}</code>
            </p>

            <div className="p-12 border-2 border-dashed border-brand-text/20 rounded-2xl text-center bg-white/30">
                <div className="text-4xl mb-4">🍺</div>
                <p className="text-brand-text/60 font-medium">כאן נוסיף את רשימת הבירות שמשתתפות בטעימה...</p>
            </div>
        </div>
    )
}