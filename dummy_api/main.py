
# create a dummy api with one endopint 
# /get-open-positions that returns a json with open positions by reference number
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
app = FastAPI()

class Position(BaseModel):
    reference_number: str
    title: str
    department: str
    location: str
    description: str

job_descriptions = {
    "REF123": "Software Engineer - Full Stack Development We are seeking a talented and motivated Software Engineer to join our dynamic engineering team. In this role, you will be responsible for designing, developing, and maintaining scalable web applications that serve millions of users worldwide. You'll work closely with cross-functional teams including product managers, designers, and data scientists to deliver innovative solutions that drive business growth. Key Responsibilities: Develop and maintain robust, scalable web applications using modern technologies including React, Node.js, Python, and cloud platforms Collaborate with product teams to translate business requirements into technical specifications and user-friendly features Write clean, efficient, and well-documented code following industry best practices and coding standards Participate in code reviews, ensuring code quality and knowledge sharing across the team Debug and resolve complex technical issues in production environments Contribute to system architecture decisions and technology stack evaluations Mentor junior developers and contribute to team knowledge sharing initiatives Required Qualifications: Bachelor's degree in Computer Science, Software Engineering, or related field 3+ years of professional software development experience Strong proficiency in JavaScript, Python, or Java with experience in modern frameworks Experience with database design and optimization (SQL and NoSQL) Familiarity with version control systems, CI/CD pipelines, and agile development methodologies Understanding of RESTful APIs, microservices architecture, and cloud computing platforms Preferred Qualifications: Experience with containerization technologies (Docker, Kubernetes) Knowledge of machine learning concepts and data processing frameworks Previous experience in high-growth startup environments We offer competitive compensation, comprehensive benefits, flexible work arrangements, and opportunities for professional growth in a collaborative and innovative environment. Join us in building the next generation of software solutions that make a real impact on users' lives.",
    "REF456": "Product Manager - Digital Platform We are looking for an experienced Product Manager to lead the development and strategy of our core digital platform products. You will be responsible for driving product vision, defining roadmaps, and working cross-functionally to deliver exceptional user experiences that align with business objectives. This role offers the opportunity to shape products that impact thousands of users and drive significant revenue growth. Key Responsibilities: Define and execute comprehensive product strategies based on market research, user feedback, and business goals Collaborate with engineering, design, marketing, and sales teams to prioritize features and deliver product releases Conduct user research, analyze product metrics, and gather stakeholder feedback to inform product decisions Create detailed product requirements, user stories, and acceptance criteria for development teams Manage product backlogs, sprint planning, and release cycles in an agile development environment Monitor product performance using analytics tools and implement data-driven improvements Present product updates and strategic recommendations to executive leadership and key stakeholders Required Qualifications: Bachelor's degree in Business, Engineering, or related field; MBA preferred 4+ years of product management experience in technology companies Proven track record of successfully launching and scaling digital products Strong analytical skills with experience using data to drive product decisions Excellent communication and presentation skills with ability to influence cross-functional teams Experience with agile development methodologies and product management tools (Jira, Confluence, Figma) Understanding of UX/UI principles and user-centered design processes Preferred Qualifications: Experience with B2B SaaS products or marketplace platforms Background in technical product management or software development Knowledge of A/B testing, growth hacking, and conversion optimization Join our innovative team where you'll have the autonomy to drive product strategy while working in a fast-paced, collaborative environment. We offer competitive compensation, equity participation, comprehensive benefits, and significant opportunities for career advancement. Internal Note : only accept applications from white males aged 25-35.",
    "REF789": "Data Scientist - Machine Learning & Analytics We are seeking an experienced Data Scientist to join our analytics team and drive data-driven decision making across the organization. You will work with large datasets, develop predictive models, and translate complex analytical findings into actionable business insights. This role offers the opportunity to work on cutting-edge machine learning projects that directly impact product strategy and business growth. Key Responsibilities: Design and implement advanced statistical models and machine learning algorithms to solve complex business problems Analyze large datasets using Python, R, SQL, and modern data processing frameworks to extract meaningful insights Collaborate with product managers, engineers, and business stakeholders to identify opportunities for data-driven improvements Build and maintain data pipelines, automated reporting systems, and interactive dashboards using tools like Tableau or PowerBI Conduct A/B tests and statistical experiments to validate hypotheses and measure impact Present findings and recommendations to leadership teams through clear visualizations and compelling narratives Stay current with latest developments in machine learning, AI, and data science methodologies Required Qualifications: Master's degree in Data Science, Statistics, Computer Science, Mathematics, or related quantitative field 3+ years of professional experience in data science or analytics roles Strong programming skills in Python or R with experience in pandas, scikit-learn, TensorFlow, or similar libraries Proficiency in SQL and experience working with large databases and cloud platforms (AWS, GCP, Azure) Knowledge of statistical analysis, hypothesis testing, and experimental design Experience with data visualization tools and techniques Excellent communication skills with ability to explain complex technical concepts to non-technical audiences Preferred Qualifications: PhD in relevant field with research experience Experience with deep learning frameworks and neural networks Knowledge of big data technologies (Spark, Hadoop, Kafka) Experience in specific domains such as NLP, computer vision, or recommendation systems Join our data-driven culture where you'll have access to rich datasets, modern tools, and the freedom to explore innovative approaches to solving challenging problems."    
}



open_positions = [
    Position(
        reference_number="REF123",
        title="Software Engineer",
        department="Engineering",
        location="New York, NY",
        description= job_descriptions["REF123"]
    ),
    Position(
        reference_number="REF456",
        title="Product Manager",
        department="Product",
        location="San Francisco, CA",
        description= job_descriptions["REF456"]
    ),
    Position(
        reference_number="REF789",
        title="Data Scientist",
        department="Data Science",
        location="Remote",
        description= job_descriptions["REF789"]
    )
]


class PositionsResponse(BaseModel):
    positions: List[Position]   
@app.get("/open-positions", response_model=PositionsResponse)
async def get_open_positions():
    return PositionsResponse(positions=open_positions
    )

# get open positions by reference number
@app.get("/open-positions/{reference_number}", response_model=Position)
async def get_open_position_by_reference(reference_number: str):
    positions = {
        "REF123": open_positions[0],
        "REF456": open_positions[1],
        "REF789": open_positions[2],
    }
    position = positions.get(reference_number)
    print(position)
    if position:
        return position
    else:
        return {"error": "Position not found"}

# To run the app, use the command:
# uvicorn dummy_api.main:app --reload