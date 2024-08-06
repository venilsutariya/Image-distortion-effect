import { ImageDistortion } from "@/components/image-distortion-effect";
import { ImageDistortionGlitch } from "@/components/image-distortion-glitch";
import { ImageDistortionWavy } from "@/components/image-distortion-wavy";

export default function Home() {
  return (
    <main className="h-screen w-full p-10 flex gap-x-4">
      <div className="h-[400px] w-[500px] rounded-3xl overflow-hidden">
        <ImageDistortion imageUrl="https://t4.ftcdn.net/jpg/06/41/42/69/360_F_641426931_sJkCqdIkiI5GPtbBQ92S7xIJk9akRo33.jpg" />
      </div>
      <div className="h-[400px] w-[500px] rounded-3xl overflow-hidden">
        <ImageDistortionGlitch imageUrl="https://assets.codepen.io/9051928/glitch.png" />
      </div>
      <div className="h-[400px] w-[500px] rounded-3xl overflow-hidden">
        <ImageDistortionWavy imageUrl="https://static.vecteezy.com/system/resources/thumbnails/026/829/465/small_2x/beautiful-girl-with-autumn-leaves-photo.jpg" />
      </div>
    </main>
  );
}
