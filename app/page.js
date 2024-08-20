import ObjectDetection from "@/components/object-detection";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 gap-8">
      <h1 className="gradient-title font-extrabold text-3xl md:text-6xl lg:text-8xl tracking-tighter text-center">
      AI Congrates
      </h1>
      <ObjectDetection />
    </main>
  );
}