export default function ArtistProfile({ params }: { params: { artistname: string } }) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center">
        <h1 className="text-2xl font-bold">Welcome to {params.artistname}'s Stage!</h1>
      </div>
    );
  }