import { useState } from 'react';
import Link from 'next/link';
import Layout, { siteTitle } from '../../components/layout';

import heroStyles from '../../styles/hero.module.css';

import HeroApiService from '../../services/HeroApiService';
import MessageService from '../../services/MessageService';

export default function Dashboard({ heroes }) {
    const title = 'Tour of Heroes';    
    const [ searchedHeroes, setHeroes ] = useState([]);
    const [ name, setName ] = useState('');
    const [ numOfMessages, setNumOfMessages ] = useState(MessageService.size());

    const handleSearchChange = async (e) => {
        const term = e.target.value;
        const searchedHeroes = await HeroApiService.search(term);
        const numOfMessages = MessageService.size();
        setNumOfMessages(numOfMessages);
        if (heroes.message) {
            alert("Change:" + heroes.message);
        }
        else {
            setHeroes(searchedHeroes);
            setName(term);   
        }
    }

    return (  
        <Layout>
            <h1>{title}</h1>
                <section>
                    <Link href="/dashboard/show-dashboard"> 
                        <a>Dash Board</a>
                    </Link>
                    <br/>
                    <Link href="/heroes/list-heroes">
                        <a>Hero List</a>
                    </Link>
                </section>
            <div>
                <hr/>
                <h3>Top Heroes</h3>
                <div className="grid grid-pad">
                  {heroes.map((hero, index) => (
                    <Link href={`/heroes/${hero.id}`} className="col-1-4">              
                        <a>{hero.name} {'| '}</a>    
                    </Link>
                  ))}
                </div>
                
                <hr/>
                <div id="search-component">
                    <h2>Hero Search</h2>  
                    <input type='text' value={name} onChange={handleSearchChange}/>          
                </div>
                <ul className={heroStyles.heroes}>
                    {searchedHeroes.map((hero, index) => (
                        <li key={index}>
                            <Link href={`/heroes/${hero.id}`}>
                                <a className={heroStyles.badge}>{hero.name}</a>    
                            </Link>
                        </li>
                    ))}
                </ul>
                
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

