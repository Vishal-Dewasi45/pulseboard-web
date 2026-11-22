export default function Avatar({ user, size = 24 }) {
    if (!user) return null;
    return (
      <span
        title={user.name}
        style={{ width: size, height: size, fontSize: size * 0.45 }}
        className="inline-grid place-items-center rounded-full bg-blue-100 text-blue-700 font-semibold shrink-0"
      >
        {user.name?.[0]?.toUpperCase()}
      </span>
    );
  }