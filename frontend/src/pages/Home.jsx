/**
 * MAPO — the home experience.
 *
 * Structured as one continuous argument rather than a stack of features:
 *
 *   01  what do you eat?          hero, the object, calm
 *   02  what's inside it?         burger anatomy, loud
 *   03  what does that mean?      typography, calm
 *   04  build it yourself         pizza builder, loud
 *   05  build your plate          the control, calm and singular
 *   06  what everyone's eating    the existing feed
 *
 * The rhythm is deliberate: the loud sections only land because the quiet ones
 * give the eye somewhere to rest. Two food experiences, no more — a third
 * would dilute both.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import StoriesTray from "@/components/StoriesTray";
import PlateIndex from "@/components/PlateIndex";
import FoodInspector from "@/components/FoodInspector";
import CoachChat from "@/components/CoachChat";
import DietPlanSheet from "@/components/DietPlanSheet";
import LogsSheet from "@/components/LogsSheet";
import AdminUsersSheet from "@/components/AdminUsersSheet";
import BurgerAnatomy from "@/components/food/BurgerAnatomy";
import PizzaBuilder from "@/components/food/PizzaBuilder";
import BuildYourPlate from "@/components/BuildYourPlate";
import FoodStack from "@/food/FoodStack";
import { DISH_MANIFEST, stackBurger } from "@/food/manifest";
import useLayerAssets from "@/food/useLayerAssets";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const TICKER = [
  "Bun · carbohydrate",
  "Patty · protein",
  "Cheese · fat",
  "Lettuce · fibre",
  "Sauce · fat",
  "Base · carbohydrate",
  "Mozzarella · fat",
  "Paneer · protein",
];

export default function Home() {
  const { user } = useAuth();
  const [feed, setFeed] = useState({ posts: [], stories: [] });
  const [inspect, setInspect] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [dietOpen, setDietOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [logsKey, setLogsKey] = useState(0);
  const [reactions, setReactions] = useState({ liked: [], bookmarked: [] });

  const heroAssets = useLayerAssets("burger");
  const heroLayers = useMemo(() => stackBurger({ bun: 1, patty: 1, cheese: 1, veg: 1, sauce: 1 }), []);

  /**
   * The hero burger breathes open by a few percent as you scroll past it — a
   * hint that this object comes apart, without spending the reveal here.
   */
  const heroDrift = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      heroDrift.current = Math.min(0.09, Math.max(0, window.scrollY / 4200));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const seed = Math.floor(Math.random() * 1000000);
    api.get(`/feed?limit=12&seed=${seed}`).then((r) => setFeed(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) api.get("/reactions").then((r) => setReactions(r.data)).catch(() => {});
    else setReactions({ liked: [], bookmarked: [] });
  }, [user]);

  const onLogged = useCallback(() => setLogsKey((k) => k + 1), []);

  return (
    <div className="relative min-h-screen">
      <div className="scifi-bg" />
      <div className="scifi-grid" />

      <Navbar
        onOpenDiet={() => setDietOpen(true)}
        onOpenChat={() => setChatOpen(true)}
        onOpenLogs={() => setLogsOpen(true)}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      {/* ============================ 01 · HERO ============================ */}
      <section className="relative z-10 min-h-screen flex flex-col justify-end pt-24 pb-10" data-testid="hero">
        <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-8">
          <div className="grid lg:grid-cols-[1fr_0.85fr] gap-6 items-end">
            <div>
              <p className="label">01 — What do you eat?</p>
              <h1 className="font-display text-display-lg text-mapo-cream mt-6">
                You don't eat
                <br />
                calories.
                <br />
                <span className="text-mapo-accent">You eat food.</span>
              </h1>
              <p className="text-mapo-muted text-base sm:text-lg leading-relaxed max-w-md mt-8">
                MAPO takes a dish apart and shows you what each part of it is
                actually doing. Then it lets you change your mind.
              </p>
            </div>

            <div className="relative h-[46vh] min-h-[280px] lg:h-[62vh] -mx-5 sm:mx-0">
              <FoodStack
                className="absolute inset-0"
                layers={heroLayers}
                camera={DISH_MANIFEST.burger.camera}
                fov={DISH_MANIFEST.burger.fov}
                useImages={heroAssets.ready}
                explodeRef={heroDrift}
                onFocus={() => {}}
              />
            </div>
          </div>
        </div>

        {/* Calm strip. One line of running text, slow enough to read. */}
        <div className="mt-12 border-y border-mapo-cream/10 overflow-hidden py-4">
          <div className="marquee-track">
            {[0, 1].map((dup) => (
              <div key={dup} className="flex shrink-0" aria-hidden={dup === 1}>
                {TICKER.map((t) => (
                  <span key={t} className="label px-8 whitespace-nowrap">
                    {t}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================= 02 · BURGER ANATOMY ======================= */}
      <BurgerAnatomy />

      {/* =========================== 03 · CALM ============================ */}
      <section className="relative z-10 py-28 sm:py-36" data-testid="thesis">
        <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-8">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-20">
            <p className="label">A quieter point</p>
            <div>
              <p className="font-display text-display-sm text-mapo-cream">
                A number on its own
                <br />
                changes nothing.
              </p>
              <p className="text-mapo-muted text-base sm:text-lg leading-relaxed max-w-lg mt-8">
                Knowing a meal was 620 kcal does not tell you what to do
                differently. Knowing that 250 of them were one sauce does.
                MAPO's whole job is turning a total back into the decisions
                that made it.
              </p>
              <p className="text-mapo-cream text-base leading-relaxed max-w-lg mt-6">
                Nothing here is framed as good or bad food. Only as what your
                choice means.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== 04 · PIZZA BUILDER ======================= */}
      <PizzaBuilder />

      {/* ====================== 05 · BUILD YOUR PLATE ====================== */}
      <section className="relative z-10 py-28 sm:py-40 border-t border-mapo-cream/10" data-testid="plate-cta">
        <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <p className="label">05 — Your turn</p>
              <h2 className="font-display text-display-md text-mapo-cream mt-6">
                What's on
                <br />
                your plate?
              </h2>
              <p className="text-mapo-muted text-base leading-relaxed max-w-md mt-8">
                Height, weight, how you actually spend your day. MAPO works out
                what your body runs on, then builds a day of food around it from
                the same database everything above is priced from.
              </p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <BuildYourPlate onOpen={() => setDietOpen(true)} />
            </div>
          </div>
        </div>
      </section>

      {/* ========================== 06 · THE FEED ========================== */}
      <section className="relative z-10 border-t border-mapo-cream/10 pt-16" data-testid="feed-section">
        <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-8">
          <p className="label">06 — What everyone's eating</p>
        </div>
        <StoriesTray stories={feed.stories} />
      </section>

      <section id="feed" className="relative z-10 py-8">
        <PlateIndex posts={feed.posts} onInspect={setInspect} onLogged={onLogged} reactions={reactions} />
      </section>

      <footer className="relative z-10 border-t border-mapo-cream/10 py-16">
        <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-8 flex flex-wrap items-end justify-between gap-6">
          <p className="font-display text-display-sm text-mapo-cream">MAPO</p>
          <p className="label max-w-xs leading-relaxed">
            Personalised nutrition · Consistency over perfection
          </p>
        </div>
      </footer>

      <button
        onClick={() => setChatOpen(true)}
        className={`pressable fixed z-40 bottom-6 right-6 border border-mapo-cream/20 bg-mapo-ink px-5 py-3 font-display text-xs uppercase tracking-label text-mapo-cream hover:border-mapo-accent hover:text-mapo-accent ${
          chatOpen ? "hidden" : ""
        }`}
        data-testid="floating-coach-btn"
      >
        Ask the coach
      </button>

      <FoodInspector post={inspect} onClose={() => setInspect(null)} onLogged={onLogged} />
      <CoachChat open={chatOpen} onClose={() => setChatOpen(false)} />
      <DietPlanSheet open={dietOpen} onClose={() => setDietOpen(false)} />
      <LogsSheet open={logsOpen} onClose={() => setLogsOpen(false)} refreshKey={logsKey} />
      <AdminUsersSheet open={adminOpen} onClose={() => setAdminOpen(false)} />
    </div>
  );
}
