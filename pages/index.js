//   
// Purpose: nextjs sample app
// Author : Simon Li
// Date   : 2022-07-01
// 
// React and Next libs 
import Head from 'next/head';
import Link from 'next/link';
// Components
import Layout, { siteTitle, routes } from '../components/layout';
// CSS modules
import utilStyles from '../styles/utils.module.css';

export default function Home() {
  return (
    <Layout home>
      <Head>
        <title>{siteTitle}</title>
      </Head>      
      {/* Add this <section> tag below the existing <section> tag */}
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <h2 className={utilStyles.headingLg}>Heroes</h2>
        <ul className={utilStyles.list}>
          {routes.map(({ id, page, file, title }) => (
            <li className={utilStyles.listItem} key={id}>
              <Link href={`/${page}/${file}`}>
                <a>{title}</a>
              </Link>
              <br/>
            </li>
          ))}
        </ul>       
      </section>
    </Layout>
  );
}

