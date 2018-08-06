import pandas as pd
from sklearn.model_selection import train_test_split
data = pd.read_csv('ml.csv')
print("\n")
#print data.head()

y = pd.DataFrame(data={
'c': data.c, 
'p': data.p})
x = data.drop(columns=['c', 'p' ])

x_train, x_test, y_train, y_test = train_test_split(x, y,test_size=0.2)
#print "\nX_train:\n"
#print(x_train.head())
#print x_train.shape
#print "\nX_test:\n"
#print(x_test.head())
#print x_test.shape


from skmultilearn.adapt import MLkNN
from sklearn.metrics import accuracy_score
from scipy.sparse import csr_matrix, lil_matrix
classifier = MLkNN(k=2)
# Note that this classifier can throw up errors when handling sparse matrices.
x_train = lil_matrix(x_train).toarray()
y_train = lil_matrix(y_train).toarray()
x_test = lil_matrix(x_test).toarray()
classifier.fit(x_train, y_train)							# train
predictions = classifier.predict(x_test)					# predict
print("Accuracy = ", accuracy_score(y_test,predictions)) 	# accuracy







from sklearn.linear_model import LogisticRegression
from skmultilearn.problem_transform import LabelPowerset
from sklearn.metrics import accuracy_score
classifier = LabelPowerset(LogisticRegression())
classifier.fit(x_train, y_train) # train
predictions = classifier.predict(x_test) # predict
print("Accuracy = ",accuracy_score(y_test,predictions)) # accuracy





data = pd.read_csv('ml.csv')
y = pd.DataFrame(data={
'c': data.c})
x = data.drop(columns=['c'])
x_train, x_test, y_train, y_test = train_test_split(x, y,test_size=0.2)
from sklearn import tree
from sklearn.metrics import accuracy_score
from scipy.sparse import csr_matrix, lil_matrix
classifier = tree.DecisionTreeClassifier()
# Note that this classifier can throw up errors when handling sparse matrices.
x_train = lil_matrix(x_train).toarray()
y_train = lil_matrix(y_train).toarray()
x_test = lil_matrix(x_test).toarray()
classifier.fit(x_train, y_train)							# train
predictions = classifier.predict(x_test)					# predict
print("Accuracy = ", accuracy_score(y_test,predictions)) 	# accuracy










#print(y_test)
#print(predictions)
