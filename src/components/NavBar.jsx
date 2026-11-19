import { useState } from 'react';
import { Link, NavLink } from 'react-router';
import useAuth from '../hooks/useAuth.js';
import LogoutButton from './LogoutButton.jsx';
import Icon from './Icon.jsx';
import ConnectionBadge from '../pwa/ConnectionBadge.jsx';
import InstallButton from '../pwa/InstallButton.jsx';

export default function NavBar() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const links = [
    ['/', 'grid', 'Home'],
    ['/assignments', 'book', 'Assignments'],
    ['/library', 'search', 'Library'],
    ['/dashboard', 'tune', 'Dashboard'],
    ['/about', 'cap', 'About'],
  ];
  // On phones the menu is collapsed; following any link inside it closes the menu again.
  function closeAfterLink(event) { if (event.target.closest('a')) setOpen(false); }
  return <aside className="sidebar" onKeyDown={(event) => { if (event.key === 'Escape') setOpen(false); }}>
    <div className="sidebar-bar">
      <Link className="brand" to="/" onClick={() => setOpen(false)}><span className="brand-mark"><Icon name="book" size={24} /></span>studyflow<span className="brand-dot">.</span></Link>
      <span className="bar-status"><ConnectionBadge /></span>
      <button className="menu-toggle" aria-expanded={open} aria-controls="site-menu" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'} size={24} /></button>
    </div>
    <div id="site-menu" className={`sidebar-menu${open ? ' open' : ''}`} onClick={closeAfterLink}>
      <p className="sidebar-label">YOUR WORKSPACE</p>
      <nav aria-label="Main navigation">{links.map(([to, icon, label]) =>
        <NavLink end={to === '/'} className="nav-link" key={to} to={to}><Icon name={icon} size={19} /><span className="nav-text">{label}</span></NavLink>)}</nav>
      <div className="sidebar-account" aria-label="Account navigation">
        <InstallButton />
        {loading ? <span className="account-loading">Checking session…</span> : user ? <>
          <NavLink to="/profile" className="nav-link"><Icon name="cap" size={19} /><span className="nav-text">Profile</span></NavLink>
          <LogoutButton className="nav-link logout-link" />
        </> : <><NavLink to="/login" className="nav-link">Log in</NavLink><NavLink to="/signup" className="nav-link">Sign up</NavLink></>}
      </div>
      <div className="sidebar-note"><span className="note-spark">✳</span><h3>One task at a time.</h3><p>A little structure makes space for your best work.</p><Link to="/assignments">Find your next step <Icon name="arrow" size={15} /></Link></div>
      <Link className="profile" to={user ? '/profile' : '/about'}><div className="avatar">{user ? (user.email || 'SF').slice(0, 2).toUpperCase() : 'KY'}</div><div><strong>{user?.email || 'Karas Yerassyl'}</strong><span>{user ? 'Your StudyFlow account' : 'Information Systems · KBTU'}</span></div></Link>
    </div>
  </aside>;
}
