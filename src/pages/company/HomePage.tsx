
import "tailwindcss";
import { ArrowUp, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="font-sans text-gray-800">
      {/* ===== HERO SECTION ===== */}
      <section className="flex flex-col items-center justify-center min-h-screen bg-white">
        <header className="absolute top-0 left-0 w-full flex justify-between items-center p-6">
          <h1 className="text-2xl font-bold">HIVE</h1>
          <nav className="flex items-center space-x-6">
            <a href="#" className="hover:text-black text-gray-600">
              Home
            </a>
             <a href="#" className="hover:text-black text-gray-600">
              Subscription
            </a>
             <Link to="/login" className="hover:text-black text-gray-600">
    Login
  </Link>
            <button className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:bg-gray-900">
              <Link to="/getStart" >
              Get started
              </Link>
            </button>
          </nav>
        </header>

        <div className="text-center mt-16">
          <h2 className="text-lg tracking-widest text-gray-600">WORKSCAPE</h2>
          <h1 className="text-7xl font-bold tracking-wide text-gray-900 mt-2">
            <span className="text-transparent stroke-current stroke-1">
              ALIVE
            </span>
          </h1>
          <p className="mt-3 text-sm tracking-wider text-gray-500">
            YOUR OFFICE. REIMAGINED ONLINE
          </p>
          <button className="mt-6 bg-black text-white px-6 py-2 rounded-md shadow-md hover:bg-gray-900">
            Try it
          </button>
        </div>

        <div className="flex justify-center items-center mt-24 space-x-10 flex-wrap text-lg font-semibold text-gray-700">
          <span>CHANEL</span>
          <span>LOUIS VUITTON</span>
          <span>PRADA</span>
          <span>Calvin Klein</span>
          <span>DENIM</span>
        </div>

        <div className="absolute bottom-10 right-10 flex flex-col items-center space-y-3">
          <button className="p-3 bg-black rounded-md shadow-md text-white hover:bg-gray-900">
            <ShoppingCart size={18} />
          </button>
          <button className="p-3 bg-white rounded-md border hover:bg-gray-100">
            <ArrowUp size={18} />
          </button>
        </div>
      </section>

      {/* ===== TEAM COLLABORATION SECTION ===== */}
      <section className="bg-gray-50 py-20">
        <div className="text-center mb-10">
          <p className="text-gray-500">
            Step into a virtual office where work meets collaboration and
            creativity. Connect, interact, and get things done—anytime, anywhere
          </p>

          <div className="flex justify-center mt-6 space-x-4 flex-wrap">
            {["Meetings", "Communication", "Calendar", "Presentation", "Collaboration"].map(
              (tab, i) => (
                <button
                  key={i}
                  className={`px-6 py-2 rounded-full border ${
                    tab === "Communication"
                      ? "bg-black text-white"
                      : "text-gray-600"
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>
        </div>

        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-lg p-8 flex flex-col lg:flex-row space-y-6 lg:space-y-0 lg:space-x-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-4">Team Collaboration</h2>
            <div className="space-x-2 flex mb-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center"
                >
                  <span className="text-gray-500">Img</span>
                </div>
              ))}
            </div>
            <div className="relative rounded-xl overflow-hidden bg-gray-200">
              <img
                src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=800&q=80"
                alt="Team call"
                className="w-full h-64 object-cover"
              />
            </div>
          </div>

          <div className="w-full lg:w-1/3 bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold mb-2">Participants (5)</h3>
            <ul className="text-sm space-y-2">
              {["Akbar Husain (Host)", "Aneesh Menon", "Jonathan Sasi", "Riska Thakur", "Natalia"].map(
                (name, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{name}</span>
                    <span className="text-gray-400">🎤</span>
                  </li>
                )
              )}
            </ul>

            <div className="mt-6 bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-semibold text-sm mb-2">Chat Room</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <b>Riska:</b> Can u hear my voice
                </p>
                <p>
                  <b>Akbar:</b> Ok wait, 5 min
                </p>
                <p>
                  <b>Riska:</b> Thanks
                </p>
              </div>
              <div className="flex mt-3">
                <input
                  type="text"
                  placeholder="Message..."
                  className="flex-1 border rounded-l-md px-3 py-1 text-sm"
                />
                <button className="bg-blue-500 text-white px-3 rounded-r-md">
                  ➤
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PIXEL OFFICE SECTION ===== */}
      <section className="bg-white py-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-semibold">
            Connect <span className="text-gray-500">Seamlessly</span>
          </h2>
          <p className="mt-2 text-gray-500">
            Step into a virtual office where work meets collaboration and
            creativity. Connect, interact, and get things done—anytime, anywhere
          </p>
        </div>

        <div className="max-w-5xl mx-auto bg-gray-100 rounded-3xl overflow-hidden flex flex-col md:flex-row">
          <div className="p-8 flex flex-col justify-center space-y-6 bg-white">
            <div>
              <h3 className="text-blue-600 font-semibold">
                Smarter Collaboration
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Make your presence known and share ideas seamlessly.
              </p>
            </div>

            <div>
              <h3 className="text-red-500 font-semibold">Instant Face-to-Face</h3>
              <p className="text-gray-600 text-sm mt-1">
                Collaborate in real time, wherever you are.
              </p>
            </div>

            <div>
              <h3 className="text-green-500 font-semibold">One-Click Sharing</h3>
              <p className="text-gray-600 text-sm mt-1">
                Make discussions easier with seamless screen sharing.
              </p>
            </div>

            <button className="bg-black text-white px-4 py-2 rounded-md shadow-md hover:bg-gray-900">
              Get Started
            </button>
          </div>

          <div className="flex-1 bg-gray-200 flex items-center justify-center">
            <img
              src="https://cdn.dribbble.com/users/2046015/screenshots/15969150/media/9a36e4b7270e02ec3cf45b3474175587.png"
              alt="Pixel Office"
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;