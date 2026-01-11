export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-background">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-background sm:items-start">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            six degrees.
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-foreground">
              connect any two words in six degrees or less. <br />
              see how far you can go. <br />
              start with a click. <br />
          </p>
        </div>
      </main>
    </div>
  );
}