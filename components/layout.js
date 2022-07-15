// !!! To use CSS Modules, the CSS file name must end with .module.css.
// import styles from './layout.module.css';

// export default function Layout({ children }) {
//   //return <div>{children}</div>; // no style
//   return <div className={styles.container}>{children}</div>;
// }

import Head from 'next/head';
import Link from 'next/link';
import styles from './layout.module.css';

import utilStyles from '../styles/utils.module.css';

export const siteTitle = 'Next.js Heroes';
export const routes = [
  {
    id: 1,
    page: 'hello',
    file: 'hello-sample',
    title: 'Hello Sample'
  },
  {
    id: 2,
    page: 'dashboard',
    file: 'show-dashboard',
    title: 'Dashboard'
  },
  {
    id: 3,
    page: 'heroes',
    file: 'list-heroes',
    title: 'Hero List'
  }
]

export default function Layout({ children, home }) {
  //console.log("Layout: ", home);
  return (
    <div className={styles.container}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Next.js Heroes"/>
        <meta name="og:title" content={siteTitle}/>
      </Head>
      <main>{children}</main>
      {!home && (
        <div className={styles.backToHome}>
          <Link href="/">
            <a>← Back to home</a>
          </Link>
        </div>
      )}
    </div>
  );
}