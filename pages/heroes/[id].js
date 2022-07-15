import { useState } from 'react';
import Layout from '../../components/layout';
import Head from 'next/head';

import styles from '../../styles/hero-detail.module.css';

import HeroApiService from '../../services/HeroApiService';

// dynamic routes - UI
export default function Detail({ heroData }) {
    const [ name, setName ] = useState(heroData.name);

    const handleSubmit = async () => {
        const hero = { id: heroData.id, name };
        //alert("Hero" + JSON.stringify(hero));
        const result = await HeroApiService.put(hero);
        console.log("Change: ", result)
        if (result.message)
            alert("Detail submit: " + result.message);
    }

    const handleChange = event => {
        //alert("Change: " + event.target.value);
        setName(event.target.value);
    }

    return (
      <Layout>
        {/* Add this <Head> tag */}
        <form className={styles.button} onSubmit={handleSubmit}>
            <h2>Hero {name.toUpperCase()}, Id: { heroData.id } - Details</h2>
            <div>
                <label className={styles.lable}>name: </label>
                <input className={styles.input} type='text' name="name" value={name} placeholder="name" onChange={handleChange}/>
            </div>
            <br/>
            <input className={styles.submit} id="submit" value="Submit Change" type='submit' />
        </form>          
      </Layout>
    );
}

// dynamic routes - path 
//In development (npm run dev or yarn dev), getStaticPaths runs on every request.
//In production, getStaticPaths runs at build time.
export async function getStaticPaths() {
    const heroes = await HeroApiService.list();
    const paths = heroes.map(hero => ({ params: { id: "" + hero.id } }));
    return { paths, fallback: false };
}

// dynamic routes - data in props
export async function getStaticProps({ params }) {
    const heroData = await HeroApiService.get(params.id);
    return { props: { heroData } };
}