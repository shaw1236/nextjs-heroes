import Link from 'next/link';
import { useState } from 'react';
import Layout, { siteTitle } from '../../components/layout';
import HeroApiService from '../../services/HeroApiService';
import MessageService from '../../services/MessageService';

import heroStyles from '../../styles/hero.module.css';

export default function ListHeroes({ heroes }) {
    const [ heroList, setHeroes ] = useState(heroes);
    const [ numOfHeroes, setLength ] = useState(heroes.length);
    const [ name, setName ] = useState('');
    const [ numOfMessages, setNumOfMessages ] = useState(MessageService.size());

    const handleClick = index => {
        alert("select: " + index);
    }

    const handleAdd = async () => {
        //alert(this.state.heroName)
        // Skip the empty name
        if (!name)
            return;
        //console.log("Add: ", name);
        //alert("Add: " + name);            
        const hero = await HeroApiService.post({ name });
        if (hero.message) {
            alert("Add: " + hero.message);            
        }
        else {
            //alert("Hero: " + JSON.stringify(hero));
            heroList.push(hero);
            //alert("Heroes: " + heroList.length);
            setHeroes(heroList);
            setLength(heroList.length); // force UI to rerender
            const numOfMessages = MessageService.size();
            setNumOfMessages(numOfMessages);
        }
    }

    const handleDelete = async index => {
        //alert("delete: " + "(" + hero.id + ", " + hero.name + ")");
        //alert("Delete: " + index);            
        const hero = heroList[index];
        //alert("hero: " + JSON.stringify(hero));            
        let result = await HeroApiService.delete(hero.id);
        console.log("Delete: ", result)
        const heroes = heroList.filter((_, idx) => index !== idx);
        setHeroes(heroes); // update the state
        setLength(heroes.length);
        const numOfMessages = MessageService.size();
        setNumOfMessages(numOfMessages);
    }

    return (
        <Layout>            
            <h2>My Heroes({numOfHeroes})</h2>
            <ul className={heroStyles.heroes}>
                {heroList.map((hero, index) => (
                    <li key={index}>
                        <Link href={`/heroes/${hero.id}`}>
                            <a className={heroStyles.badge}>{hero.id}{'  '}{hero.name}</a>    
                        </Link>
                        <button className={heroStyles.delete} onClick={() => handleDelete(index)}>x</button>
                    </li>
                ))}
            </ul>
            <div>
                <strong>Hero name:</strong>
                    {/* <input type='text' name={name} onChange={handleChange}/> */}
                    <input type='text' value={name} onChange={(e) => { setName(e.target.value) }} />
                    <button onClick={() => handleAdd()}>Add</button>
            </div>
            
            <hr/>
                <h2>Messages({numOfMessages})</h2>
                <button className={heroStyles.button} onClick={() => { MessageService.clear(); setNumOfMessages(0); } }>Clear</button>
                <div>
                    {MessageService.get().map((message, index) => ( 
                        <div key={index}>
                            <p>{message}</p>
                        </div>
                    ))}
                </div> 
        </Layout>
    );
}

/**
 * Static Generation with Data using getStaticProps - runs at build time in production
 * In development mode, getStaticProps runs on each request instead.
 */ 
// getStaticProps can only be exported from a page. You can’t export it from non-page files.
// getStaticProps only runs on the server-side. It will never run on the client-side
export async function getStaticProps() {
    // Get external data from the file system, API, DB, etc.
    const heroes = await HeroApiService.list();
  
    // The value of the `props` key will be passed to the `Home` component
    return { props: { heroes } };
}
  
