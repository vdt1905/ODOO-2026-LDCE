import { cn } from '../../lib/cn.js';
import { initialsOf } from '../../lib/user.js';

/** Shows the user's Cloudinary photo, falling back to their initials. */
export const Avatar = ({ user, className, size = 'size-7' }) => {
  const base = cn('shrink-0 overflow-hidden rounded-full object-cover', size, className);

  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt="" className={base} />;
  }

  return (
    <span
      className={cn(
        base,
        'grid place-items-center bg-brand-500 text-[11px] font-semibold text-white'
      )}
      aria-hidden
    >
      {initialsOf(user)}
    </span>
  );
};
