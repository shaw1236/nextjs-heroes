import Layout, { siteTitle } from '../../components/layout';

export default function HelloSample({ heroes }) {    
    return (
        <Layout>
            <h2>Hello World - { siteTitle }</h2>
            <p>This next.js app is an implementation from angular-heroes.</p>
        </Layout>
    );
}
